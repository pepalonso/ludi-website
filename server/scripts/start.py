import subprocess
import sys

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
    run_command(
        "sam build",
        "Building the SAM application",
    )

    run_command(
        "sam local start-api",
        "Starting the API locally for testing",
    )


if __name__ == "__main__":
    try:
        test_locally()
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)
