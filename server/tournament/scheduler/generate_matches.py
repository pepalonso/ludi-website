import json
import os
import random
import itertools
from typing import Dict, List, Any

def load_json(file_path: str) -> Dict:
    with open(file_path, 'r') as f:
        return json.load(f)

def save_json(data: Dict, file_path: str) -> None:
    with open(file_path, 'w') as f:
        json.dump(data, f, indent=2)

def group_teams_by_category_gender(teams: List[Dict]) -> Dict[str, List[Dict]]:
    """Group teams by category and gender"""
    groups = {}
    for team in teams:
        key = f"{team['category']}_{team['gender']}"
        if key not in groups:
            groups[key] = []
        groups[key].append(team)
    return groups

def assign_teams_to_subgroups(teams: List[Dict], schema: Dict) -> Dict[int, List[Dict]]:
    """Randomly assign teams to subgroups based on the schema"""
    subgroups = {}
    teams_copy = teams.copy()
    random.shuffle(teams_copy)
    
    for subgroup in schema['subgroups']:
        subgroup_id = subgroup['id']
        team_count = subgroup['team_number']
        subgroups[subgroup_id] = teams_copy[:team_count]
        teams_copy = teams_copy[team_count:]
    
    return subgroups

def create_regular_matches(subgroups: Dict[int, List[Dict]], two_way_matches: bool, match_id_start: int) -> tuple[List[Dict], int]:
    """Create regular phase matches between teams in the same subgroup"""
    matches = []
    match_id = match_id_start
    
    for subgroup_id, teams in subgroups.items():
        # Generate all possible team pairs in this subgroup
        team_pairs = list(itertools.combinations(teams, 2))
        
        for team_a, team_b in team_pairs:
            match = {
                "id": match_id,
                "subgroup_id": subgroup_id,
                "phase": "regular",
                "team_a_id": team_a["id"],
                "team_b_id": team_b["id"],
                "status": "pending"
            }
            matches.append(match)
            match_id += 1
            
            # Add return match if two-way matches are enabled
            if two_way_matches:
                match = {
                    "id": match_id,
                    "subgroup_id": subgroup_id,
                    "phase": "regular",
                    "team_a_id": team_b["id"],
                    "team_b_id": team_a["id"],
                    "status": "pending"
                }
                matches.append(match)
                match_id += 1
    
    return matches, match_id

def create_elimination_matches(schema: Dict, two_way_elimination: bool, match_id_start: int) -> tuple[List[Dict], int]:
    """Create elimination phase matches (quarterfinals, semifinals, final)"""
    matches = []
    match_id = match_id_start
    phases = ["quarterfinals", "semifinals", "final"]
    
    for phase in phases:
        if phase in schema:
            phase_matches = schema[phase].get("matches", [])
            
            for i, match_data in enumerate(phase_matches):
                match = {
                    "id": match_id,
                    "phase": phase,
                    "match_index": i,
                    "team_a_source": match_data["team_a"],
                    "team_b_source": match_data["team_b"],
                    "status": "pending"
                }
                matches.append(match)
                match_id += 1
                
                # Add return match if two-way elimination is enabled
                if two_way_elimination:
                    match = {
                        "id": match_id,
                        "phase": phase,
                        "match_index": i,
                        "team_a_source": match_data["team_b"],
                        "team_b_source": match_data["team_a"],
                        "status": "pending"
                    }
                    matches.append(match)
                    match_id += 1
    
    return matches, match_id

def generate_tournament_structure():
    # Get the absolute paths to the config files
    current_dir = os.path.dirname(os.path.abspath(__file__))
    config_path = os.path.join(current_dir, "..", "competition.config.json")
    teams_path = os.path.join(current_dir, "..", "teams.json")
    
    # Load the configuration and teams
    config = load_json(config_path)
    teams_data = load_json(teams_path)
    teams = teams_data.get("teams", [])
    
    # Get competition settings
    comp_settings = config["competition"]
    two_way_matches = comp_settings.get("two_way_matches", False)
    two_way_elimination = comp_settings.get("two_way_elimination_matches", False)
    
    # Group teams by category and gender
    groups = group_teams_by_category_gender(teams)
    
    # Tournament structure to be generated
    tournament_groups = []
    tournament_matches = []
    
    group_id = 0
    # Global match ID counter
    match_id = 0
    
    for group_key, group_teams in groups.items():
        category, gender = group_key.split("_")
        team_count = len(group_teams)
        
        # Find the appropriate schema for this group size
        schema_key = f"{team_count}_team_groups"
        if schema_key not in config["competition_schema"]:
            print(f"Warning: No schema found for {team_count} teams in group {category}_{gender}")
            continue
        
        schema = config["competition_schema"][schema_key]
        
        # Assign teams to subgroups
        subgroups = assign_teams_to_subgroups(group_teams, schema)
        
        # Record the group structure
        group_info = {
            "id": group_id,
            "category": category,
            "gender": gender,
            "team_count": team_count,
            "schema_key": schema_key,
            "subgroups": []
        }
        
        # Record subgroup information
        for subgroup_id, subgroup_teams in subgroups.items():
            subgroup_info = {
                "id": subgroup_id,
                "name": next(sg["name"] for sg in schema["subgroups"] if sg["id"] == subgroup_id),
                "teams": [team["id"] for team in subgroup_teams]
            }
            group_info["subgroups"].append(subgroup_info)
        
        tournament_groups.append(group_info)
        
        # Create regular matches for this group
        regular_matches, match_id = create_regular_matches(subgroups, two_way_matches, match_id)
        for match in regular_matches:
            match["group_id"] = group_id
        tournament_matches.extend(regular_matches)
        
        # Create elimination matches for this group
        elimination_matches, match_id = create_elimination_matches(schema, two_way_elimination, match_id)
        for match in elimination_matches:
            match["group_id"] = group_id
        tournament_matches.extend(elimination_matches)
        
        group_id += 1
    
    # Save the tournament structure as two separate files
    groups_output_path = os.path.join(current_dir, "tournament_groups.json")
    matches_output_path = os.path.join(current_dir, "tournament_matches.json")
    
    save_json({"groups": tournament_groups}, groups_output_path)
    save_json({"matches": tournament_matches}, matches_output_path)
    
    print(f"Generated tournament structure with {len(tournament_groups)} groups and {len(tournament_matches)} matches")
    print(f"Saved to {groups_output_path} and {matches_output_path}")

if __name__ == "__main__":
    generate_tournament_structure() 