import os
import sys
import time
import subprocess
import boto3
import zipfile

# --------- CONFIGURATION ---------
LAMBDA_FUNCTIONS = [
    # {
    #  "function_name": "write-to-db",
    #  "sam_build_dir": ".aws-sam/build/HandleTeamInscription",
    #  "zip_filename": "lambda.zip",
    # },
    # {
    #    "function_name": "send-WA",
    #    "sam_build_dir": ".aws-sam/build/SendWA",
    #    "zip_filename": "lambda2.zip",
    # },
    # {
    #    "function_name": "authorizer",
    #    "sam_build_dir": ".aws-sam/build/AuthorizeWA",
    #    "zip_filename": "lambda3.zip",
    # },
    # {
    #    "function_name": "fitxes_uploader",
    #    "sam_build_dir": ".aws-sam/build/FitxesUploader",
    #    "zip_filename": "fitxes_uploader.zip",
    # },
    # {
    #     "function_name": "n8n_reader",
    #     "sam_build_dir": ".aws-sam/build/n8nReader",
    #     "zip_filename": "n8nReader.zip",
    # },
    # {
    #    "function_name": "admin_authorizer",
    #    "sam_build_dir": ".aws-sam/build/adminAuthorizer",
    #    "zip_filename": "adminAuthorization.zip",
    # },
    # {
    #    "function_name": "global_reader",
    #    "sam_build_dir": ".aws-sam/build/globalData",
    #    "zip_filename": "globalDataReader.zip",
    # },
    # {
    #     "function_name": "twofa_generator",
    #     "sam_build_dir": ".aws-sam/build/twoFactorGenerator",
    #     "zip_filename": "2fa_generator.zip",
    # }
    # {
    #     "function_name": "twofa_validator",
    #     "sam_build_dir": ".aws-sam/build/twoFactorValidator",
    #     "zip_filename": "2fa_validator.zip",
    # }
    # {
    #     "function_name": "db_cli",
    #     "sam_build_dir": ".aws-sam/build/dbConnector",
    #     "zip_filename": "db_cli.zip",
    # }
    # {
    #     "function_name": "send_wa_two_fa",
    #     "sam_build_dir": ".aws-sam/build/SendWATwoFA",
    #     "zip_filename": "send_wa_two_fa.zip",
    # }
    # {
    #     "function_name": "get_admin_session_token",
    #     "sam_build_dir": ".aws-sam/build/GetSessionToken",
    #     "zip_filename": "get_admin_session_token.zip",
    # },
    {
        "function_name": "get_qr_details",
        "sam_build_dir": ".aws-sam/build/GetQRDetails",
        "zip_filename": "get_qr_details.zip",
    }
]

lambda_client = boto3.client("lambda")


# --------- HELPER FUNCTIONS ---------
def animate_task(task_name):
    """
    Display a simple animated loading message for a task.
    """
    frames = ["⠋", "⠙", "⠚", "⠞", "⠖", "⠦", "⠴", "⠲", "⠳", "⠓"]
    print(f"\n🔄 {task_name}", end="", flush=True)
    return frames


def run_command(command, task_name):
    """
    Run a shell command with basic error handling and optional animation.
    """
    frames = animate_task(task_name)
    try:
        process = subprocess.Popen(
            command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE
        )
        while process.poll() is None:
            for frame in frames:
                print(f"\r{frame} {task_name}", end="", flush=True)
                time.sleep(0.1)

        stdout, stderr = process.communicate()
        if process.returncode != 0:
            print(f"\r❌ {task_name} failed!\n{stderr.decode()}")
            sys.exit(1)
        else:
            print(f"\r✅ {task_name} completed.")
    except Exception as e:
        print(f"\r❌ {task_name} failed!\nError: {e}")
        sys.exit(1)


def build_sam():
    """
    Build only the active SAM functions.
    """
    active_functions = get_active_functions()
    if not active_functions:
        print("❌ No active functions to build!")
        sys.exit(1)
        
    # Build each active function
    for fn in active_functions:
        # The function name in the template is the resource name (e.g., GetQRDetails)
        template_function_name = fn["sam_build_dir"].split("/")[-1]
        run_command(f"sam build {template_function_name}", f"Building {template_function_name}...")


def zip_directory(source_dir, output_zip):
    """
    Zip all files within 'source_dir' into 'output_zip' using Python's zipfile.
    """
    # Remove old ZIP if it exists
    if os.path.exists(output_zip):
        os.remove(output_zip)

    print(f"\n🔄 Compressing directory '{source_dir}' into '{output_zip}'...")
    with zipfile.ZipFile(output_zip, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(source_dir):
            for file in files:
                full_path = os.path.join(root, file)
                # Make the file path relative so it doesn't store absolute paths
                relative_path = os.path.relpath(full_path, start=source_dir)
                zf.write(full_path, relative_path)
    print(f"✅ Created ZIP: {output_zip}")


def upload_zip_to_lambda(zip_path, lambda_name):
    """
    Upload the given ZIP file to the specified AWS Lambda function.
    """
    print(f"\n🚀 Uploading '{zip_path}' to Lambda '{lambda_name}'...")
    if not os.path.exists(zip_path):
        print(f"❌ Error: The file '{zip_path}' does not exist!")
        sys.exit(1)

    try:
        with open(zip_path, "rb") as f:
            lambda_client.update_function_code(
                FunctionName=lambda_name, ZipFile=f.read()
            )
        print(f"✅ Lambda function '{lambda_name}' updated successfully!")
    except Exception as e:
        print(f"❌ Failed to upload Lambda function '{lambda_name}'!\nError: {e}")
        sys.exit(1)


def get_active_functions():
    return [fn for fn in LAMBDA_FUNCTIONS if not fn.get("function_name", "").startswith("#")]


# --------- MAIN DEPLOYMENT ---------
def deploy_lambda():
    """
    Full deployment process: build once, zip each function, upload to AWS.
    """
    print("\n🚀 Starting Lambda deployment process...")
    build_sam()  # Build everything once

    for fn in LAMBDA_FUNCTIONS:
        # Zip each function
        zip_directory(fn["sam_build_dir"], fn["zip_filename"])
        # Upload the ZIP to AWS
        upload_zip_to_lambda(fn["zip_filename"], fn["function_name"])

    print("\n🎉 Deployment completed successfully!")


if __name__ == "__main__":
    try:
        deploy_lambda()
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)
