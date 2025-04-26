# match_scheduler.py
# Main entry point for match scheduling
from scheduler_utils import *
from scheduler import *

def schedule_matches():
    # Load all required data
    matches_data, slots_data, teams_data, competition_config, current_dir = load_data()
    
    # Load configuration parameters
    config_params = load_config_parameters(teams_data, competition_config)
    
    # Load configuration into scheduler_config module
    import scheduler_config
    scheduler_config.load_config(config_params)
    
    matches = matches_data["matches"]
    slots = slots_data["match_slots"]
    teams = teams_data["teams"]
    
    # Print some debug info
    print(f"Processing {len(matches)} matches and {len(slots)} time slots")
    
    # Separate regular matches from elimination matches for easier handling
    regular_matches = [m for m in matches if m["phase"] == "regular"]
    elimination_matches = [m for m in matches if m["phase"] != "regular"]
    
    print(f"Regular matches: {len(regular_matches)}")
    print(f"Elimination matches: {len(elimination_matches)}")
    
    # Get all team IDs from regular matches
    all_team_ids = set()
    for match in regular_matches:
        all_team_ids.add(match["team_a_id"])
        all_team_ids.add(match["team_b_id"])
    
    print(f"Found {len(all_team_ids)} unique teams in regular matches")
    
    # Get team categories 
    team_categories = get_team_categories(teams)
    
    # Sort slots chronologically
    sorted_slots = sorted(slots, key=lambda x: parse_datetime(x["date"]))
    
    # Create a mapping of team to regular matches
    team_to_matches = {}
    for team_id in all_team_ids:
        team_to_matches[team_id] = []
    
    for match in regular_matches:
        team_to_matches[match["team_a_id"]].append(match["id"])
        team_to_matches[match["team_b_id"]].append(match["id"])
    
    # Schedule regular matches first
    regular_schedule, success = schedule_regular_matches(
        regular_matches, slots, sorted_slots, team_to_matches, team_categories
    )
    
    if not success:
        return False
    
    # Schedule elimination matches
    used_slot_ids = set(match["slot_id"] for match in regular_schedule)
    elimination_schedule = schedule_elimination_matches(
        elimination_matches, slots, used_slot_ids
    )
    
    # Combine schedules
    complete_schedule = regular_schedule + elimination_schedule
    
    # Sort schedule by date and court
    complete_schedule.sort(key=lambda x: (parse_datetime(x["date"]), x["court_name"]))
    
    # Save the schedule
    output_path = os.path.join(current_dir, "match_schedule.json")
    save_json({"schedule": complete_schedule}, output_path)
    
    print(f"Schedule saved to {output_path}")
    print(f"Total matches scheduled: {len(complete_schedule)}/{len(matches)}")
    
    return True

if __name__ == "__main__":
    schedule_matches()