# Dynamic configuration module for match scheduler
# Parameters are loaded from competition.config.json

# Default values (will be overridden when loadConfig is called)
MIN_REST_SLOTS = 2
ALLOWED_COURTS_FOR_MINI = ["A1", "A2", "A3", "B4", "B5", "B6"]
PRE_MINI_DEADLINE = "2025-06-13T00:45:00"
NIGHT_GAME_START = "2025-06-13T00:00:00" 
NIGHT_GAME_END = "2025-06-13T08:15:00"
COURT_VARIETY_WEIGHT = 100
NIGHT_GAME_WEIGHT = 50
TIME_SPREAD_WEIGHT = 200
MAX_SOLVE_TIME_SECONDS = 600

def load_config(config_params):
    """Load configuration from parameters dictionary"""
    global MIN_REST_SLOTS, ALLOWED_COURTS_FOR_MINI, PRE_MINI_DEADLINE
    global NIGHT_GAME_START, NIGHT_GAME_END
    global COURT_VARIETY_WEIGHT, NIGHT_GAME_WEIGHT, TIME_SPREAD_WEIGHT
    global MAX_SOLVE_TIME_SECONDS
    
    # Update module globals with values from config
    MIN_REST_SLOTS = config_params["MIN_REST_SLOTS"]
    ALLOWED_COURTS_FOR_MINI = config_params["ALLOWED_COURTS_FOR_MINI"]
    PRE_MINI_DEADLINE = config_params["PRE_MINI_DEADLINE"]
    NIGHT_GAME_START = config_params["NIGHT_GAME_START"]
    NIGHT_GAME_END = config_params["NIGHT_GAME_END"]
    COURT_VARIETY_WEIGHT = config_params["COURT_VARIETY_WEIGHT"]
    NIGHT_GAME_WEIGHT = config_params["NIGHT_GAME_WEIGHT"]
    TIME_SPREAD_WEIGHT = config_params["TIME_SPREAD_WEIGHT"]
    MAX_SOLVE_TIME_SECONDS = config_params["MAX_SOLVE_TIME_SECONDS"]