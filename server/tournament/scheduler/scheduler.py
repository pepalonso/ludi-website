# scheduler.py
# Main match scheduling implementation
from ortools.sat.python import cp_model
from typing import Dict, List, Any, Set, Tuple
from scheduler_utils import *
from constraints import *
from optimizations import add_optimization_objectives
from scheduler_config import *

def schedule_regular_matches(
    regular_matches: List[Dict],
    slots: List[Dict],
    sorted_slots: List[Dict],
    team_to_matches: Dict[int, List[int]],
    team_categories: Dict[int, str]
):
    """Schedule regular matches using CP model"""
    # Create the CP model
    model = cp_model.CpModel()
    
    # Create variables for match-slot assignments
    match_slot = {}
    for match in regular_matches:
        match_slot[match["id"]] = {}
        for slot in slots:
            match_slot[match["id"]][slot["id"]] = model.NewBoolVar(f'm{match["id"]}_s{slot["id"]}')
    
    # Create slot to index mapping (needed for optimizations)
    slot_to_index = {slot["id"]: i for i, slot in enumerate(sorted_slots)}
    
    # Add all constraints
    add_basic_constraints(model, regular_matches, slots, match_slot)
    add_team_constraints(model, regular_matches, slots, sorted_slots, match_slot, team_to_matches)
    add_category_constraints(model, regular_matches, slots, match_slot, team_categories)
    # Add phase order constraints
    add_phase_order_constraints(model, regular_matches, slots, sorted_slots, match_slot)
    
    # Add optimization objectives
    objective_vars = add_optimization_objectives(
        model, regular_matches, slots, sorted_slots, match_slot, 
        team_to_matches, team_categories, slot_to_index
    )
    
    # Solve the model
    print("Starting optimization...")
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = MAX_SOLVE_TIME_SECONDS
    solver.parameters.log_search_progress = True
    
    status = solver.Solve(model)
    
    if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
        print("Solution found for regular matches!")
        
        # Print optimization scores
        if status == cp_model.OPTIMAL:
            print("Optimal solution found!")
        else:
            print("Feasible solution found!")
            
        print(f"Court variety score: {solver.Value(objective_vars['court_variety'])}")
        print(f"Night game score: {solver.Value(objective_vars['night_game'])}")
        print(f"Time spread score: {solver.Value(objective_vars['time_spread'])}")
        print(f"Total score: {solver.Value(objective_vars['total'])}")
        
        # Create the schedule for regular matches
        schedule = []
        for match in regular_matches:
            for slot in slots:
                if solver.Value(match_slot[match["id"]][slot["id"]]) == 1:
                    match_info = match.copy()
                    match_info["slot_id"] = slot["id"]
                    match_info["date"] = slot["date"]
                    match_info["court_name"] = slot["court_name"]
                    match_info["court_location"] = slot["court_location"]
                    schedule.append(match_info)
                    break
        
        return schedule, True
    else:
        print("No solution found.")
        print("Solver status:", status)
        return [], False

def schedule_elimination_matches(
    elimination_matches: List[Dict],
    slots: List[Dict],
    used_slot_ids: Set[int]
):
    """Schedule elimination matches using a greedy approach"""
    remaining_slots = [slot for slot in slots if slot["id"] not in used_slot_ids]
    
    # Sort remaining slots by date/time
    sorted_slots = sorted(remaining_slots, key=lambda s: parse_datetime(s["date"]))
    
    # Sort elimination matches by phase
    phase_order = {"quarterfinals": 0, "semifinals": 1, "final": 2}
    sorted_elimination = sorted(elimination_matches, 
                                key=lambda m: phase_order.get(m["phase"], 0))
    
    # Group matches by subgroup to enforce phase order
    matches_by_subgroup = {}
    for match in sorted_elimination:
        subgroup_id = match.get("subgroup_id", match.get("group_id", 0))
        if subgroup_id not in matches_by_subgroup:
            matches_by_subgroup[subgroup_id] = []
        matches_by_subgroup[subgroup_id].append(match)
    
    schedule = []
    current_slot_index = 0
    
    # Process each subgroup separately to maintain phase order
    for subgroup_id, subgroup_matches in matches_by_subgroup.items():
        for match in subgroup_matches:
            if current_slot_index >= len(sorted_slots):
                print(f"Warning: No slots left for match {match['id']}")
                continue
                
            # Pick the next available slot
            slot = sorted_slots[current_slot_index]
            current_slot_index += 1
            
            match_info = match.copy()
            match_info["slot_id"] = slot["id"]
            match_info["date"] = slot["date"]
            match_info["court_name"] = slot["court_name"]
            match_info["court_location"] = slot["court_location"]
            schedule.append(match_info)
    
    return schedule