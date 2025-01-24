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


def deploy_to_prod():
    """
    Deploy the application to production using SAM CLI.
    """
    print("🚀 Starting deployment process...")

    run_command(
        "sam validate --lint",
        "Validating the SAM template"
    )

    run_command(
        "sam package --template-file template.yml --s3-bucket ludibasquet-backend-deploymens-prod  --output-template-file packaged.yml",
        "Packaging the SAM application"
    )

    run_command(
        "sam deploy --template-file packaged.yml --stack-name ludibasquet-stack --capabilities CAPABILITY_IAM",
        "Deploying the SAM stack"
    )

    print("\n🎉 Deployment to production completed successfully!")


if __name__ == "__main__":
    try:
        deploy_to_prod()
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)
