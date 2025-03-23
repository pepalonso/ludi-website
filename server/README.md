## DEPLOY THE APPLICATION TO AWS

- deploying the application to aws execute the deploy.py script on the scripts folder. You can do so with this command, on windows, for linux and mac you will need to make the file executable

This will create a packaged.yml that should not be included on git

```bash
    python scripts/deploy.py
```

## TEST THE APPLICATION LOCALY

For testing the appication localy you can run this other script on the script folder. make sure you have:

- docker engine running, on windows you can just start it by instaling docker desktop:
- Activate the python virtual enviroment
  For this application we are using **python3.12**
  If not created allready, create it (make sure you have python installed):

```bash
    # Windows
    python -m venv venv

    # MacOs/Linux
    python3 -m venv venv
```

After creating it, activate it:

```bash
    # Windows
    .\venv\Scripts\Activate

    #MacOs/Linux
    source venv/bin/activate
```

Now you can start the application localy using:

```bash
    python scripts/start.py
```

This will start the api localy on your machine, also the lambda functions, but for the moment they wont be integrated with the DB

## Local Databse

For starting the local DB

```bash
     docker build -t db database
     docker run --name db -p 3306:3306 -d db
```

For seeing the tables on the local databse you can run.

```bash
    docker ps
```

Get the container ID and use it here:

```bash
    docker exec -it <containerID> bash
```

and inside the container run:

```bash
    mariadb -u root -p admin

    #If not, run withouit admin
    mariadb -u root -p
```
