import subprocess
import sys
import time
import boto3
import os

LAMBDA_FUNCTION_NAME = "ludibasquet-stack-HandleTeamInscription-YZZiwneP9FPg"
FUNCTION_NAME = "HandleTeamInscription"
BUILD_PATH = f".aws-sam/build/{FUNCTION_NAME}"
ZIP_NAME = "lambda.zip"
ZIP_PATH = os.path.abspath(ZIP_NAME)

# AWS Client
lambda_client = boto3.client("lambda")

def animate_task(task_name):
    """
    Display an animated loading message while executing a task.
    """
    frames = ["⠋", "⠙", "⠚", "⠞", "⠖", "⠦", "⠴", "⠲", "⠳", "⠓"]
    print(f"\n🔄 {task_name}", end="", flush=True)
    return frames

def run_command(command, task_name):
    """
    Run a shell command with error handling and animation.
    """
    frames = animate_task(task_name)
    try:
        process = subprocess.Popen(command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        while process.poll() is None:
            for frame in frames:
                print(f"\r{frame} {task_name}", end="", flush=True)
                time.sleep(0.1)

        stdout, stderr = process.communicate()
        if not process.returncode == 0:
            print(f"\r❌ {task_name} failed!\n{stderr.decode()}")
            sys.exit(1)
    except Exception as e:
        print(f"\r❌ {task_name} failed!\nError: {e}")
        sys.exit(1)

def build_lambda():
    """
    Build the SAM application.
    """
    run_command("sam build", "Building...")

def zip_lambda():
    """
    Compress the Lambda function's content into a ZIP file at the root directory.
    """
    build_lambda()

    os.chdir(BUILD_PATH)  # Move into the build directory

    if sys.platform == "win32":
        command = f'powershell -Command "& {{Compress-Archive -Path * -DestinationPath {ZIP_PATH} -Force}}"'
    else:
        command = f"zip -r {ZIP_PATH} ."

    run_command(command, "Compressing")

    os.chdir("../../")  # Move back to root

def upload_lambda():
    """
    Upload the ZIP file to AWS Lambda.
    """
    print("\n🚀 Uploading to AWS...")

    if not os.path.exists(ZIP_PATH):
        print(f"❌ Error: The file {ZIP_PATH} does not exist!")
        sys.exit(1)

    try:
        with open(ZIP_PATH, "rb") as f:
            lambda_client.update_function_code(
                FunctionName=LAMBDA_FUNCTION_NAME,
                ZipFile=f.read()
            )
        print(f"✅ Lambda function {LAMBDA_FUNCTION_NAME} updated successfully!")
    except Exception as e:
        print(f"❌ Failed to upload Lambda function! Error: {e}")
        sys.exit(1)

def deploy_lambda():
    """
    Full deployment process: build, zip, and upload Lambda.
    """
    print("\n🚀 Starting Lambda deployment process...")

    zip_lambda()
    upload_lambda()

    print("\n🎉 Deployment completed successfully!")

if __name__ == "__main__":
    try:
        deploy_lambda()
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)
