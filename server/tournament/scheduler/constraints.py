# constraints.py
# Functions for adding constraints to the CP model
from ortools.sat.python import cp_model
from typing import Dict, List, Any, Set
from scheduler_utils import parse_datetime
from scheduler_config import *

def add_basic_constraints(
    model: cp_model.CpModel,
    regular_matches: List[Dict],
    slots: List[Dict],
    match_slot: Dict[int, Dict[int, cp_model.BoolVarT]]
):
    """Add basic constraints for match scheduling"""
    # CONSTRAINT 1: Each match must be assigned to exactly one slot
    for match in regular_matches:
        model.Add(sum(match_slot[match["id"]][slot["id"]] for slot in slots) == 1)
    
    # CONSTRAINT 2: Each slot can have at most one match
    for slot in slots:
        model.Add(sum(match_slot[match["id"]][slot["id"]] for match in regular_matches) <= 1)

def add_team_constraints(
    model: cp_model.CpModel,
    regular_matches: List[Dict],
    slots: List[Dict],
    sorted_slots: List[Dict],
    match_slot: Dict[int, Dict[int, cp_model.BoolVarT]],
    team_to_matches: Dict[int, List[int]]
):
    """Add constraints related to team scheduling"""
    # CONSTRAINT 3: Teams can't play two matches at the same time
    for team_id, match_ids in team_to_matches.items():
        for slot in slots:
            model.Add(sum(match_slot[match_id][slot["id"]] for match_id in match_ids) <= 1)
    
    # CONSTRAINT 4: Teams must rest at least MIN_REST_SLOTS slots between matches
    for team_id, match_ids in team_to_matches.items():
        if len(match_ids) <= 1:
            continue  # Skip teams with only one match
            
        for i, slot1 in enumerate(sorted_slots):
            # Look at slots that are too close (within MIN_REST_SLOTS)
            for j in range(i+1, min(i+1+MIN_REST_SLOTS, len(sorted_slots))):
                slot2 = sorted_slots[j]
                
                # For each pair of matches this team could play
                for match_id1 in match_ids:
                    for match_id2 in match_ids:
                        if match_id1 != match_id2:
                            # Can't play both matches in slots that are too close
                            model.Add(match_slot[match_id1][slot1["id"]] + match_slot[match_id2][slot2["id"]] <= 1)

def add_category_constraints(
    model: cp_model.CpModel,
    regular_matches: List[Dict],
    slots: List[Dict],
    match_slot: Dict[int, Dict[int, cp_model.BoolVarT]],
    team_categories: Dict[int, str]
):
    """Add constraints related to team categories"""
    # CONSTRAINT 5: PRE_MINI and MINI categories can only play on specific courts
    for match in regular_matches:
        team_a_id = match["team_a_id"]
        team_b_id = match["team_b_id"]
        
        # Check if either team is PRE_MINI or MINI
        is_mini_match = False
        if team_a_id in team_categories and team_categories[team_a_id] in ["PRE_MINI", "MINI"]:
            is_mini_match = True
        if team_b_id in team_categories and team_categories[team_b_id] in ["PRE_MINI", "MINI"]:
            is_mini_match = True
        
        if is_mini_match:
            # This match can only be scheduled on allowed courts
            for slot in slots:
                if slot["court_name"] not in ALLOWED_COURTS_FOR_MINI:
                    model.Add(match_slot[match["id"]][slot["id"]] == 0)
    
    # CONSTRAINT 6: PRE_MINI should play games no later than PRE_MINI_DEADLINE on day 13
    for match in regular_matches:
        team_a_id = match["team_a_id"]
        team_b_id = match["team_b_id"]
        
        # Check if either team is PRE_MINI
        is_pre_mini_match = False
        if team_a_id in team_categories and team_categories[team_a_id] == "PRE_MINI":
            is_pre_mini_match = True
        if team_b_id in team_categories and team_categories[team_b_id] == "PRE_MINI":
            is_pre_mini_match = True
        
        if is_pre_mini_match:
            # This match must be scheduled before the deadline
            deadline_time = parse_datetime(PRE_MINI_DEADLINE)
            for slot in slots:
                slot_time = parse_datetime(slot["date"])
                if slot_time > deadline_time:
                    model.Add(match_slot[match["id"]][slot["id"]] == 0)

def add_phase_order_constraints(
    model: cp_model.CpModel,
    matches: List[Dict],
    slots: List[Dict],
    sorted_slots: List[Dict],
    match_slot: Dict[int, Dict[int, cp_model.BoolVarT]]
):
    """
    Add constraints to enforce the competition phase order:
    regular -> quarterfinals -> semifinals -> finals
    
    This ensures that for each subgroup, all regular matches are scheduled before
    quarterfinals, all quarterfinals before semifinals, and all semifinals before finals.
    """
    # CONSTRAINT 7: Match phases must follow the correct order
    
    # Define the order of phases
    phase_order = {
        "regular": 0,
        "quarterfinals": 1,
        "semifinals": 2,
        "final": 3
    }
    
    # Group matches by subgroup
    matches_by_subgroup = {}
    for match in matches:
        subgroup_id = match.get("subgroup_id")
        if subgroup_id is not None:
            if subgroup_id not in matches_by_subgroup:
                matches_by_subgroup[subgroup_id] = []
            matches_by_subgroup[subgroup_id].append(match)
    
    # For each subgroup, enforce phase order
    for subgroup_id, subgroup_matches in matches_by_subgroup.items():
        # Group matches by phase
        matches_by_phase = {}
        for match in subgroup_matches:
            phase = match.get("phase", "regular")
            if phase not in matches_by_phase:
                matches_by_phase[phase] = []
            matches_by_phase[phase].append(match)
        
        # For each pair of phases in order
        for phase1, phase2 in [("regular", "quarterfinals"), 
                              ("quarterfinals", "semifinals"), 
                              ("semifinals", "final")]:
            
            # Skip if either phase doesn't have matches
            if phase1 not in matches_by_phase or phase2 not in matches_by_phase:
                continue
            
            # All matches of phase1 must be scheduled before any match of phase2
            for match1 in matches_by_phase[phase1]:
                for match2 in matches_by_phase[phase2]:
                    for i, slot1 in enumerate(sorted_slots):
                        # For each later slot
                        for j in range(i+1, len(sorted_slots)):
                            slot2 = sorted_slots[j]
                            
                            # match1 can't be scheduled after match2
                            # If match1 is in slot2 and match2 is in slot1, this is invalid
                            model.Add(match_slot[match1["id"]][slot2["id"]] + 
                                     match_slot[match2["id"]][slot1["id"]] <= 1)