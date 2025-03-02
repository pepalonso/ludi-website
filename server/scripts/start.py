import subprocess
import sys
import os
import signal
from dotenv import load_dotenv
from cfn_tools import load_yaml, dump_yaml

# Store dummy values that will be restored on exit
DUMMY_VALUES = {
    "DB_ENDPOINT": "dummy-endpoint",
    "DB_NAME": "dummy-db",
    "DB_USER": "dummy-user",
    "DB_PASSWORD": "dummy-password",
    "ACCOUNT_SID": "dummy-sid",
    "AUTH_TOKEN": "dummy-token",
    "SENDER_PHONE": "dummy-phone",
    "CONTENT_SID": "dummy-content",
    "FRONTEND_URL": "dummy-url",
}

# List of lambda function names to update
LAMBDA_FUNCTIONS = ["HandleTeamInscription", "SendWA", "AuthorizeWA"]


def restore_dummy_values():
    """
    Restore dummy values in template.yml for each Lambda function that has matching environment variables.
    """
    print("\n🔄 Restoring dummy values in template.yml...")
    template_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)), "template.yml"
    )

    try:
        with open(template_path, "r") as file:
            template = load_yaml(file.read())

        for func in LAMBDA_FUNCTIONS:
            # Check if the function exists in the template
            if func in template.get("Resources", {}):
                env_vars = (
                    template["Resources"][func]
                    .get("Properties", {})
                    .get("Environment", {})
                    .get("Variables", {})
                )
                # Only update the keys that exist in the function's environment variables
                for key in env_vars.keys():
                    if key in DUMMY_VALUES:
                        env_vars[key] = DUMMY_VALUES[key]
                print(f"✅ Dummy values restored for {func}")
            else:
                print(f"ℹ️ {func} not found in template.yml, skipping.")

        with open(template_path, "w") as file:
            file.write(dump_yaml(template))
    except Exception as e:
        print(f"❌ Error restoring dummy values: {e}")


def load_env_and_update_template():
    """
    Load environment variables from .env.dev and update template.yml for each Lambda function.
    Only updates keys that are already present in each function's environment variables.
    """
    print("\n🔧 Loading environment variables and updating template...")

    # Load environment variables from .env.dev
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env.dev")
    if not load_dotenv(env_path):
        print("❌ .env.dev file not found!")
        sys.exit(1)

    # Load template.yml
    template_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)), "template.yml"
    )
    with open(template_path, "r") as file:
        template = load_yaml(file.read())

    for func in LAMBDA_FUNCTIONS:
        if func in template.get("Resources", {}):
            env_vars = (
                template["Resources"][func]
                .get("Properties", {})
                .get("Environment", {})
                .get("Variables", {})
            )
            # Update only those keys that are already defined
            for key in env_vars.keys():
                env_vars[key] = os.getenv(key, env_vars[key])
            print(f"✅ Environment variables updated for {func}")
        else:
            print(f"ℹ️ {func} not found in template.yml, skipping update.")

    # Write the updated template back
    with open(template_path, "w") as file:
        file.write(dump_yaml(template))


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
    print("\n🛠️ Starting local testing process...")

    # Load environment variables and update the template for all lambda functions
    load_env_and_update_template()

    # Ask the user whether to run the SAM build step
    choice = input("Do you want to build the SAM application? (y/n): ").strip().lower()
    if choice == "y":
        run_command("sam build", "Building the SAM application")
    else:
        print("ℹ️ Skipping SAM build as per user choice.")

    run_command("docker rm -f db || true", "Removing existing database container")
    run_command("docker build -t db database", "Building the database image")
    run_command(
        "docker run --name db -p 3306:3306 -d db", "Running the database container"
    )

    # This command is blocking. When you hit Ctrl+C, KeyboardInterrupt will be raised.
    run_command(
        "sam local start-api --warm-containers EAGER",
        "Starting the API locally for testing",
    )


if __name__ == "__main__":
    try:
        test_locally()
    except KeyboardInterrupt:
        print("\n🚦 KeyboardInterrupt received. Exiting...")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)
    finally:
        restore_dummy_values()
