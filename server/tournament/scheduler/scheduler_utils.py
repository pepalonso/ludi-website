# scheduler_utils.py
# Utility functions for the match scheduler
import json
import os
import datetime
from typing import Dict, List, Any, Tuple

def load_json(file_path: str) -> Dict:
    with open(file_path, 'r') as f:
        return json.load(f)

def save_json(data: Dict, file_path: str) -> None:
    with open(file_path, 'w') as f:
        json.dump(data, f, indent=2)

def parse_datetime(date_str: str) -> datetime.datetime:
    return datetime.datetime.fromisoformat(date_str)

def load_data() -> Tuple[Dict, Dict, Dict, Dict, str]:
    """Load and return all required data files"""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    matches_path = os.path.join(current_dir, "simplified_matches.json")
    slots_path = os.path.join(current_dir, "match_slots.json")
    teams_path = os.path.join(current_dir, "..", "teams.json")
    config_path = os.path.join(current_dir, "..", "competition.config.json")
    
    matches_data = load_json(matches_path)
    slots_data = load_json(slots_path)
    teams_data = load_json(teams_path)
    competition_config = load_json(config_path)
    
    return matches_data, slots_data, teams_data, competition_config, current_dir

def get_team_categories(teams: List[Dict]) -> Dict[int, str]:
    """Create a mapping of team ID to category"""
    team_categories = {}
    for team in teams:
        team_categories[team["id"]] = team["category"]
    return team_categories

def load_config_parameters(teams_data, config_data):
    """Extract scheduler parameters from competition.config.json"""
    config_params = {}
    
    # Get scheduling parameters from config
    scheduler_config = config_data.get("scheduler", {})
    
    # Team scheduling constraints
    config_params["MIN_REST_SLOTS"] = scheduler_config.get("minRestSlots", 2)
    
    # Court restrictions
    config_params["ALLOWED_COURTS_FOR_MINI"] = scheduler_config.get("allowedCourtsForMini", 
                                                                 ["A1", "A2", "A3", "B4", "B5", "B6"])
    
    # Time restrictions
    config_params["PRE_MINI_DEADLINE"] = scheduler_config.get("preMiniDeadline", "2025-06-13T00:45:00")
    config_params["NIGHT_GAME_START"] = scheduler_config.get("nightGameStart", "2025-06-13T00:00:00")
    config_params["NIGHT_GAME_END"] = scheduler_config.get("nightGameEnd", "2025-06-13T08:15:00")
    
    # Optimization weights
    config_params["COURT_VARIETY_WEIGHT"] = scheduler_config.get("courtVarietyWeight", 100)
    config_params["NIGHT_GAME_WEIGHT"] = scheduler_config.get("nightGameWeight", 50)
    config_params["TIME_SPREAD_WEIGHT"] = scheduler_config.get("timeSpreadWeight", 200)
    
    # Solver settings
    config_params["MAX_SOLVE_TIME_SECONDS"] = scheduler_config.get("maxSolveTimeSeconds", 600)
    
    return config_params