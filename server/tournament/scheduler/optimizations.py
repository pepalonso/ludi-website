# optimizations.py
from ortools.sat.python import cp_model
from typing import Dict, List, Any, Set
from scheduler_utils import parse_datetime
from scheduler_config import *

def add_optimization_objectives(
    model: cp_model.CpModel,
    regular_matches: List[Dict],
    slots: List[Dict],
    sorted_slots: List[Dict],
    match_slot: Dict[int, Dict[int, cp_model.BoolVarT]],
    team_to_matches: Dict[int, List[int]],
    team_categories: Dict[int, str],
    slot_to_index: Dict[int, int]
):
    """Add optimization objectives to the CP model"""
    # Get all unique court names
    all_courts = set(slot["court_name"] for slot in slots)
    print(f"Found {len(all_courts)} unique courts")
    
    # Get all unique teams
    all_teams = set(team_id for team_id in team_to_matches.keys())
    
    # 1. Court variety objective: Each team should play in as many different courts as possible
    court_variety_score = model.NewIntVar(0, len(all_teams) * len(all_courts), 'court_variety')
    
    # For each team, track if they play on each court
    team_plays_on_court = {}
    for team_id in team_to_matches:
        team_plays_on_court[team_id] = {}
        for court in all_courts:
            team_plays_on_court[team_id][court] = model.NewBoolVar(f'team_{team_id}_plays_on_{court}')
            
            # Set up the constraints to determine if a team plays on a court
            court_slots = [slot for slot in slots if slot["court_name"] == court]
            plays_match_on_court = []
            
            for match_id in team_to_matches[team_id]:
                for slot in court_slots:
                    plays_match_on_court.append(match_slot[match_id][slot["id"]])
            
            # team_plays_on_court[team_id][court] is 1 if the team plays any match on this court
            model.AddBoolOr(plays_match_on_court).OnlyEnforceIf(team_plays_on_court[team_id][court])
            model.AddBoolAnd([match.Not() for match in plays_match_on_court]).OnlyEnforceIf(team_plays_on_court[team_id][court].Not())
    
    # Sum up the court variety score
    court_variety_vars = []
    for team_id in team_plays_on_court:
        for court in team_plays_on_court[team_id]:
            court_variety_vars.append(team_plays_on_court[team_id][court])
    
    model.Add(court_variety_score == sum(court_variety_vars))
    
    # 2. Night game objective: Each team (except PRE-MINI) should play at least one night game
    night_game_score = model.NewIntVar(0, len(all_teams), 'night_game')
    
    # Identify night slots (from NIGHT_GAME_START to NIGHT_GAME_END)
    night_start_time = parse_datetime(NIGHT_GAME_START)
    night_end_time = parse_datetime(NIGHT_GAME_END)
    night_slots = [
        slot for slot in slots 
        if night_start_time <= parse_datetime(slot["date"]) <= night_end_time
    ]
    print(f"Found {len(night_slots)} slots in the night game period")
    
    # For each team, track if they play during night time
    team_plays_at_night = {}
    for team_id in team_to_matches:
        # Skip PRE-MINI teams
        if team_id in team_categories and team_categories[team_id] == "PRE_MINI":
            continue
            
        team_plays_at_night[team_id] = model.NewBoolVar(f'team_{team_id}_plays_at_night')
        
        # Set up the constraints to determine if a team plays at night
        plays_match_at_night = []
        
        for match_id in team_to_matches[team_id]:
            for slot in night_slots:
                plays_match_at_night.append(match_slot[match_id][slot["id"]])
        
        # team_plays_at_night[team_id] is 1 if the team plays any match at night
        model.AddBoolOr(plays_match_at_night).OnlyEnforceIf(team_plays_at_night[team_id])
        model.AddBoolAnd([match.Not() for match in plays_match_at_night]).OnlyEnforceIf(team_plays_at_night[team_id].Not())
    
    # Sum up the night game score
    night_game_vars = list(team_plays_at_night.values())
    model.Add(night_game_score == sum(night_game_vars))
    
    # 3. Time spread objective: Each team's matches should be spread out across the tournament
    time_spread_score = model.NewIntVar(0, 1000000, 'time_spread')
    
    # For each team, calculate the time spread between their first and last match
    team_earliest = {}
    team_latest = {}
    team_spreads = []
    
    for team_id, match_ids in team_to_matches.items():
        if len(match_ids) <= 1:
            continue  # Skip teams with only one match
            
        # Variables to track earliest and latest match times
        team_earliest[team_id] = model.NewIntVar(0, len(sorted_slots)-1, f'earliest_{team_id}')
        team_latest[team_id] = model.NewIntVar(0, len(sorted_slots)-1, f'latest_{team_id}')
        
        # For each slot, determine if the team has a match in that slot
        has_match_at_slot = {}
        for i, slot in enumerate(sorted_slots):
            has_match_at_slot[i] = model.NewBoolVar(f'team_{team_id}_has_match_at_{i}')
            
            # Set has_match_at_slot[i] = 1 if the team has any match at this slot
            match_vars = [match_slot[match_id][slot["id"]] for match_id in match_ids]
            if match_vars:  # Check if the list is not empty
                model.AddBoolOr(match_vars).OnlyEnforceIf(has_match_at_slot[i])
                model.AddBoolAnd([var.Not() for var in match_vars]).OnlyEnforceIf(has_match_at_slot[i].Not())
        
        # For each slot, determine if the team has a match at or before that slot
        for i in range(len(sorted_slots)):
            # If team has a match at slot i, then earliest <= i and latest >= i
            model.Add(team_earliest[team_id] <= i).OnlyEnforceIf(has_match_at_slot[i])
            model.Add(team_latest[team_id] >= i).OnlyEnforceIf(has_match_at_slot[i])
            
            # Detect first match: if has_match_at_slot[i] is true AND all earlier slots have no match
            if i > 0:
                first_match_at_i = model.NewBoolVar(f'team_{team_id}_first_match_at_{i}')
                model.AddBoolAnd([has_match_at_slot[i]] + 
                               [has_match_at_slot[j].Not() for j in range(i)]).OnlyEnforceIf(first_match_at_i)
                model.Add(team_earliest[team_id] == i).OnlyEnforceIf(first_match_at_i)
            else:
                # For i=0, if has_match_at_slot[0] is true, then it's the earliest
                model.Add(team_earliest[team_id] == 0).OnlyEnforceIf(has_match_at_slot[0])
        
        # For each slot, determine if it's the team's last match
        for i in range(len(sorted_slots)):
            # Detect last match: if has_match_at_slot[i] is true AND all later slots have no match
            if i < len(sorted_slots) - 1:
                last_match_at_i = model.NewBoolVar(f'team_{team_id}_last_match_at_{i}')
                model.AddBoolAnd([has_match_at_slot[i]] + 
                               [has_match_at_slot[j].Not() for j in range(i+1, len(sorted_slots))]).OnlyEnforceIf(last_match_at_i)
                model.Add(team_latest[team_id] == i).OnlyEnforceIf(last_match_at_i)
            else:
                # For the last slot, if has_match_at_slot[last] is true, then it's the latest
                model.Add(team_latest[team_id] == len(sorted_slots)-1).OnlyEnforceIf(has_match_at_slot[len(sorted_slots)-1])
        
        # Calculate spread for this team (latest minus earliest)
        team_spread = model.NewIntVar(0, len(sorted_slots)-1, f'spread_{team_id}')
        model.Add(team_spread == team_latest[team_id] - team_earliest[team_id])
        team_spreads.append(team_spread)
    
    # Sum up the time spread score
    if team_spreads:
        model.Add(time_spread_score == sum(team_spreads))
    else:
        model.Add(time_spread_score == 0)
    
    # Combine all objectives with their weights
    total_score = model.NewIntVar(0, 10000000, 'total_score')
    model.Add(total_score == 
             COURT_VARIETY_WEIGHT * court_variety_score + 
             NIGHT_GAME_WEIGHT * night_game_score + 
             TIME_SPREAD_WEIGHT * time_spread_score)
    
    # Set the objective to maximize the total score
    model.Maximize(total_score)
    
    return {
        'court_variety': court_variety_score,
        'night_game': night_game_score,
        'time_spread': time_spread_score,
        'total': total_score
    }