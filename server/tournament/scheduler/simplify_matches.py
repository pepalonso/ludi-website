import json
import os
from typing import Dict, List, Any, Optional

def load_json(file_path: str) -> Dict:
    with open(file_path, 'r') as f:
        return json.load(f)

def save_json(data: Dict, file_path: str) -> None:
    with open(file_path, 'w') as f:
        json.dump(data, f, indent=2)

def get_teams_from_subgroup(groups: List[Dict], group_id: int, subgroup_id: int) -> List[int]:
    """Get all team IDs from a specific subgroup"""
    for group in groups:
        if group["id"] == group_id:
            for subgroup in group["subgroups"]:
                if subgroup["id"] == subgroup_id:
                    return subgroup["teams"]
    return []

def get_all_teams_from_group(groups: List[Dict], group_id: int) -> List[int]:
    """Get all team IDs from all subgroups in a group"""
    all_teams = []
    for group in groups:
        if group["id"] == group_id:
            for subgroup in group["subgroups"]:
                all_teams.extend(subgroup["teams"])
    return all_teams

def simplify_matches(tournament_matches: List[Dict], tournament_groups: List[Dict]) -> List[Dict]:
    """Create simplified version of matches"""
    # Create dictionary of matches by ID for easy lookup
    matches_by_id = {match["id"]: match for match in tournament_matches}
    simplified_matches = []
    
    # First process regular phase matches which are simpler
    for match in tournament_matches:
        if match["phase"] == "regular":
            simplified_match = {
                "id": match["id"],
                "group_id": match["group_id"],
                "subgroup_id": match["subgroup_id"],
                "phase": match["phase"],
                "team_a_id": match["team_a_id"],
                "team_b_id": match["team_b_id"]
            }
            simplified_matches.append(simplified_match)
    
    # Process elimination matches in phases (quarterfinals -> semifinals -> finals)
    simplified_matches_by_id = {match["id"]: match for match in simplified_matches}
    
    for phase in ["quarterfinals", "semifinals", "final"]:
        for match in tournament_matches:
            if match["phase"] == phase:
                simplified_match = {
                    "id": match["id"],
                    "group_id": match["group_id"],
                    "phase": match["phase"],
                    "match_index": match["match_index"],
                    "possible_a_teams": [],
                    "possible_b_teams": []
                }
                
                # Process team_a source
                team_a_source = match["team_a_source"]
                if "subgroup" in team_a_source:
                    subgroup_id = team_a_source["subgroup"]
                    if subgroup_id is None:
                        # Get all teams from all subgroups in this group
                        simplified_match["possible_a_teams"] = get_all_teams_from_group(
                            tournament_groups, match["group_id"]
                        )
                    else:
                        # Get teams from specific subgroup
                        simplified_match["possible_a_teams"] = get_teams_from_subgroup(
                            tournament_groups, match["group_id"], subgroup_id
                        )
                elif "quarterfinals_match" in team_a_source:
                    match_id = team_a_source["quarterfinals_match"]
                    # Find the actual quarterfinals match ID in this group
                    for qf_match in tournament_matches:
                        if (qf_match["phase"] == "quarterfinals" and 
                            qf_match["group_id"] == match["group_id"] and 
                            qf_match["match_index"] == match_id):
                            qf_match_id = qf_match["id"]
                            # Get simplified version if available
                            if qf_match_id in simplified_matches_by_id:
                                qf_simplified = simplified_matches_by_id[qf_match_id]
                                if "possible_a_teams" in qf_simplified and "possible_b_teams" in qf_simplified:
                                    simplified_match["possible_a_teams"] = (
                                        qf_simplified["possible_a_teams"] + qf_simplified["possible_b_teams"]
                                    )
                                else:  # Handle regular matches
                                    teams = []
                                    if "team_a_id" in qf_simplified:
                                        teams.append(qf_simplified["team_a_id"])
                                    if "team_b_id" in qf_simplified:
                                        teams.append(qf_simplified["team_b_id"])
                                    simplified_match["possible_a_teams"] = teams
                elif "semifinals_match" in team_a_source:
                    match_id = team_a_source["semifinals_match"]
                    # Find the actual semifinals match ID in this group
                    for sf_match in tournament_matches:
                        if (sf_match["phase"] == "semifinals" and 
                            sf_match["group_id"] == match["group_id"] and 
                            sf_match["match_index"] == match_id):
                            sf_match_id = sf_match["id"]
                            # Get simplified version if available
                            if sf_match_id in simplified_matches_by_id:
                                sf_simplified = simplified_matches_by_id[sf_match_id]
                                if "possible_a_teams" in sf_simplified and "possible_b_teams" in sf_simplified:
                                    simplified_match["possible_a_teams"] = (
                                        sf_simplified["possible_a_teams"] + sf_simplified["possible_b_teams"]
                                    )
                                else:  # Handle regular matches
                                    teams = []
                                    if "team_a_id" in sf_simplified:
                                        teams.append(sf_simplified["team_a_id"])
                                    if "team_b_id" in sf_simplified:
                                        teams.append(sf_simplified["team_b_id"])
                                    simplified_match["possible_a_teams"] = teams
                
                # Process team_b source
                team_b_source = match["team_b_source"]
                if "subgroup" in team_b_source:
                    subgroup_id = team_b_source["subgroup"]
                    if subgroup_id is None:
                        # Get all teams from all subgroups in this group
                        simplified_match["possible_b_teams"] = get_all_teams_from_group(
                            tournament_groups, match["group_id"]
                        )
                    else:
                        # Get teams from specific subgroup
                        simplified_match["possible_b_teams"] = get_teams_from_subgroup(
                            tournament_groups, match["group_id"], subgroup_id
                        )
                elif "quarterfinals_match" in team_b_source:
                    match_id = team_b_source["quarterfinals_match"]
                    # Find the actual quarterfinals match ID in this group
                    for qf_match in tournament_matches:
                        if (qf_match["phase"] == "quarterfinals" and 
                            qf_match["group_id"] == match["group_id"] and 
                            qf_match["match_index"] == match_id):
                            qf_match_id = qf_match["id"]
                            # Get simplified version if available
                            if qf_match_id in simplified_matches_by_id:
                                qf_simplified = simplified_matches_by_id[qf_match_id]
                                if "possible_a_teams" in qf_simplified and "possible_b_teams" in qf_simplified:
                                    simplified_match["possible_b_teams"] = (
                                        qf_simplified["possible_a_teams"] + qf_simplified["possible_b_teams"]
                                    )
                                else:  # Handle regular matches
                                    teams = []
                                    if "team_a_id" in qf_simplified:
                                        teams.append(qf_simplified["team_a_id"])
                                    if "team_b_id" in qf_simplified:
                                        teams.append(qf_simplified["team_b_id"])
                                    simplified_match["possible_b_teams"] = teams
                elif "semifinals_match" in team_b_source:
                    match_id = team_b_source["semifinals_match"]
                    # Find the actual semifinals match ID in this group
                    for sf_match in tournament_matches:
                        if (sf_match["phase"] == "semifinals" and 
                            sf_match["group_id"] == match["group_id"] and 
                            sf_match["match_index"] == match_id):
                            sf_match_id = sf_match["id"]
                            # Get simplified version if available
                            if sf_match_id in simplified_matches_by_id:
                                sf_simplified = simplified_matches_by_id[sf_match_id]
                                if "possible_a_teams" in sf_simplified and "possible_b_teams" in sf_simplified:
                                    simplified_match["possible_b_teams"] = (
                                        sf_simplified["possible_a_teams"] + sf_simplified["possible_b_teams"]
                                    )
                                else:  # Handle regular matches
                                    teams = []
                                    if "team_a_id" in sf_simplified:
                                        teams.append(sf_simplified["team_a_id"])
                                    if "team_b_id" in sf_simplified:
                                        teams.append(sf_simplified["team_b_id"])
                                    simplified_match["possible_b_teams"] = teams
                
                simplified_matches.append(simplified_match)
                simplified_matches_by_id[match["id"]] = simplified_match
    
    # Sort by ID to maintain order
    simplified_matches.sort(key=lambda x: x["id"])
    return simplified_matches

def main():
    # Get the absolute paths to the files
    current_dir = os.path.dirname(os.path.abspath(__file__))
    matches_path = os.path.join(current_dir, "tournament_matches.json")
    groups_path = os.path.join(current_dir, "tournament_groups.json")
    
    # Load the data
    matches_data = load_json(matches_path)
    groups_data = load_json(groups_path)
    
    tournament_matches = matches_data["matches"]
    tournament_groups = groups_data["groups"]
    
    # Simplify the matches
    simplified_matches = simplify_matches(tournament_matches, tournament_groups)
    
    # Save the simplified matches
    output_path = os.path.join(current_dir, "simplified_matches.json")
    save_json({"matches": simplified_matches}, output_path)
    
    print(f"Generated simplified matches and saved to {output_path}")

if __name__ == "__main__":
    main() 