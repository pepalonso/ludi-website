import json
import datetime
import os

def generate_match_slots(config_path):
    # Load the configuration file
    with open(config_path, 'r') as f:
        config = json.load(f)
    
    slots_duration = config['match_slots']['slots_duration_in_minutes']
    courts = config['match_slots']['courts']
    
    all_slots = []
    slot_id = 0  # Initialize slot id counter
    
    for court in courts:
        court_name = court['name']
        court_location = court['location']
        
        for available_time in court['available_times']:
            date = available_time['date']
            start_time = available_time['start_time']
            duration_in_slots = available_time['duration_in_slots']
            
            # Parse start time and ensure proper format (add leading zero if needed)
            hour, minute = start_time.split(':')
            formatted_time = f"{int(hour):02d}:{minute}"
            
            # Parse start time
            start_datetime = datetime.datetime.fromisoformat(f"{date}T{formatted_time}:00")
            
            # Generate all slots for this court and time block
            for slot_index in range(duration_in_slots):
                slot_time = start_datetime + datetime.timedelta(minutes=slot_index * slots_duration)
                
                slot = {
                    "id": slot_id,
                    "date": slot_time.isoformat(),
                    "court_name": court_name,
                    "court_location": court_location
                }
                all_slots.append(slot)
                slot_id += 1  # Increment the slot id for the next slot
    
    return all_slots

def main():
    # Get the absolute path to the config file
    current_dir = os.path.dirname(os.path.abspath(__file__))
    config_path = os.path.join(current_dir, "..", "competition.config.json")
    
    # Generate slots
    slots = generate_match_slots(config_path)
    
    # Save to output file
    output_path = os.path.join(current_dir, "match_slots.json")
    with open(output_path, 'w') as f:
        json.dump({"match_slots": slots}, f, indent=2)
    
    print(f"Generated {len(slots)} match slots and saved to {output_path}")

if __name__ == "__main__":
    main() 