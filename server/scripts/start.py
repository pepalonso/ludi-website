import subprocess
import sys
import os
import atexit
from dotenv import load_dotenv
from cfn_tools import load_yaml, dump_yaml

# Store dummy values that will be restored on exit
DUMMY_VALUES = {
    'DB_ENDPOINT': 'dummy-endpoint',
    'DB_NAME': 'dummy-db',
    'DB_USER': 'dummy-user',
    'DB_PASSWORD': 'dummy-password',
    'ACCOUNT_SID': 'dummy-sid',
    'AUTH_TOKEN': 'dummy-token',
    'SENDER_PHONE': 'dummy-phone',
    'CONTENT_SID': 'dummy-content',
    'FRONTEND_URL': 'dummy-url'
}

def restore_dummy_values():
    """
    Restore dummy values in template.yml when the script exits
    """
    print("\n🔄 Restoring dummy values in template.yml...")
    template_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'template.yml')
    
    try:
        with open(template_path, 'r') as file:
            template = load_yaml(file.read())
        
        # Restore dummy values
        env_vars = template['Resources']['HandleTeamInscription']['Properties']['Environment']['Variables']
        env_vars.update(DUMMY_VALUES)
        
        with open(template_path, 'w') as file:
            file.write(dump_yaml(template))
            
        print("✅ Dummy values restored in template.yml!")
    except Exception as e:
        print(f"❌ Error restoring dummy values: {e}")

def load_env_and_update_template():
    """
    Load environment variables from .env.dev and update template.yml
    """
    print("\n🔧 Loading environment variables and updating template...")
    
    # Load environment variables from .env.dev
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env.dev')
    if not load_dotenv(env_path):
        print("❌ .env.dev file not found!")
        sys.exit(1)

    # Load template.yml
    template_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'template.yml')
    with open(template_path, 'r') as file:
        template = load_yaml(file.read())

    # Update environment variables in template
    env_vars = template['Resources']['HandleTeamInscription']['Properties']['Environment']['Variables']
    for key in env_vars.keys():
        env_vars[key] = os.getenv(key, env_vars[key])

    # Write updated template
    with open(template_path, 'w') as file:
        file.write(dump_yaml(template))

    print("✅ Environment variables updated in template.yml!")

def run_command(command, description):
    """
    Run a shell command and handle errors.
    """
    print(f"\n{description}...")
    try:
        subprocess.run(command, check=True, shell=True)
        print(f"✅ {description} completed successfully!")
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed! Error: {e}")
        sys.exit(1)


def test_locally():
    """
    Build and test the SAM application locally.
    """
    print("\n 🛠️ Starting local testing process...")
    
    # Register the cleanup function to run on exit
    atexit.register(restore_dummy_values)
    
    # Add this as the first step
    load_env_and_update_template()
    
    run_command(
        "sam build",
        "Building the SAM application",
    )

    run_command("docker rm -f db || true", "Removing existing database container")

    run_command(
        "docker build -t db database",
        "Building the database image",
    )

    run_command(
        "docker run --name db -p 3306:3306 -d db",
        "Running the database container",
    )


    run_command(
        "sam local start-api --warm-containers EAGER",
        "Starting the API locally for testing",
    )


if __name__ == "__main__":
    try:
        test_locally()
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)
