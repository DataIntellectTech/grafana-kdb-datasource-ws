# Grafana and KDB+ Plugin Installation Instructions

### Quick Install Guide

#### Installing Grafana:
 - If Grafana is not already installed, install Grafana from [grafana.com](https://grafana.com/grafana/download/) following the installation guide for the relevant operating system.

#### Installing kdb+ datasource plugin:
 - Download the [latest release](https://github.com/AquaQAnalytics/kdb-datasource/releases/tag/v0.1.1b). UPDATE LINK BEFORE RELEASE
 - Extract the kdb-datasource folder into *{Grafana Install Directory}/grafana/data/plugins/kdb-datasource*. CHECK EXTRACT STRUCTURE
 - Load/restart the grafana-server.
 
#### Configuring kdb+ instance:
To set websocket handler on kdb+ instance set the .z.ws message handler as below:

``.z.ws:{ds:-9!x;neg[.z.w] -8! `o`ID!(@[value;ds[`i];{$"'",x}];ds[`ID])}``

#### Adding datasource:
Navigate to the data-sources page in grafana and click *Add data source*.
At the bottom of this page under *Others* should be *KDB+*, click on this to set settings.
*Host* should be only the address and port of the kdb+ instance given as:

`ADDRESS:PORT`

*'ws://' is not required*

Default Timeout is how long in ms each query will wait for a response (will default to 5000 ms).

#### Authentication:
The plugin supports Basic authentication over insecure connections (not recommended) or secure WebSockets (recommended).
Insecure connections send all data (including user:password pairs) unencrypted.
Secure WebSockets require the kdb+ instance to be in TLS mode (see https://code.kx.com/q/kb/ssl/).

#### Security:
We **strongly** recommend running dedicated kdb+ instances only for grafana connections; no other services should operate from these instances.
If using in an open system we recommend running any kdb+ instances users can connect to as a seperate (non-root) user on the machine.
Do not allow this user to write to any directories or files on the machine.

Be aware the 'Free-form Query' 'Function' box and 'Built Query' 'Where' box allow users to run unfiltered commands on the kdb+ instance (including 'system' commands), so non-backed up system critical data should not be held on these instances and ideally only trusted users should be allowed to connect (see Authentication).

#### Supported Browsers:
Formally this adaptor has the same [compatibility as grafana](https://grafana.com/docs/grafana/latest/installation/requirements/),
however there are known bugs with lesser used browsers:
- Using authentication with Microsoft Edge is not supported.

We recommend using the latest version of either Google Chrome or Mozilla Firefox.


### Initial Setup

- Install Grafana from [grafana.com](https://grafana.com/grafana/download/) following the installation guide for the relevant operating system.
- In your browser, navigate to https://github.com/AquaQAnalytics/kdb-datasource/releases. UPDATE LINK BEFORE RELEASE. Click on the latest release and click the ‘Source code (zip)’ link to download the plugin.
- Extract the zip file in *{Grafana Install Directory}\grafana\data\plugins*.
- Before moving on, check that the README.md is at the following location: *{Grafana Install Directory}\grafana\data\plugins\kdb-datasource-`<VERSION>`\README.md*. (Where `<VERSION>` is the current version code of the plugin. e.g. `1.0`)
- (Windows: Start grafana from administrator-mode command line (*{Grafana Install Directory}\grafana\bin\grafana-server.exe*))
- (Linux: Start the grafana-server instance (`sudo systemctl start grafana-server`))
- -----------------DONT THINK THIS IS NESSECCARY---------- Open file-explorer and navigate into *{Grafana Install Directory}\data\plugins\kdb-datasource-`<VERSION>`* then right-click and cut the file named *custom*. Then navigate into *C:\Program Files\GrafanaLabs\grafana\conf* then right-click and paste. Confirm that this file, *custom*, is present at the following location : *C:\Program Files\GrafanaLabs\grafana\conf\.
- This window is now running the Grafana server. It must remain operational to use Grafana. If it is closed and needs starting, repeat the previous step.
- Setup the kdb+ instance you wish to query as per **kdb+ Setup** below.
- Launch your browser (see **Supported Browsers**) then use the following URL to open Grafana: [localhost:8080/](localhost:8080/) and sign in using Usr:`admin` Pwd:`admin` (You will be prompted for changing password. *Skip*.)
- REMOVE If you currently do not have a KDB+ session to connect, go to the Setup a TorQ Stack section of these instructions to create a session that simulates a financial data capture system. Proceed to next step if there is already a session, to which you will connect, on your network.
- REMOVE Once you have setup your KDB+ data source with correct WebSocket handler, your IP-address will be `localhost` and you should have a port corresponding to the process whose data you will be visualising. If you already have a session on your network, you should have the IP-address (numbers separated by full stops) and the port number (usually a 4- or 5-digit number).
- Go to your Grafana instance on your browser by navigating to [localhost:8080/](localhost:8080/) as before. Click on the *cog* configuration icon on the left tab of the webpage, then click on the green *Add data source* button.
- Select *KDB+* under *Others* from the list.
- In the textbox that follows ‘Host’, type in the IP address followed by a colon, followed by the port. E.g. `localhost:6002` or `192.168.1.48:6002`
- If authentication is present on the kdb+ process, select 'Use Authentication' and enter authentication details. If TLS is enabled on the kdb+ process select 'Use TLS' (see **Authentication**).
- Click the green *Save & Test* button to save and test the connection. The webpage will return a message depending on whether it was a success. If it cannot be connected, review each step again. If successful, you may now create a dashboard.

### Setup a TorQ Stack (On Windows)

- Install KDB+ using the instructions at the following link: https://code.kx.com/q/learn/install/windows/ . Be sure to also complete the *Define q as a command* section of the instructions: Open CMD as before and execute the following two lines of code sequentially:
  - `setx QHOME "C:\q"`
  - `setx PATH "%PATH%;C:\q\w32"`
- Open CMD by pressing the windows key [] (or start button) then type ‘CMD’ then right click the application and click *Run as Administrator*.
- Change directory to the desired location for the installation of TorQ. (E.g. `cd C:\Users\<USER>\Documents\`. Where `<USER>` is your account folder.)
- Then type `git clone https://github.com/AquaQAnalytics/TorQ.git` and press *enter*. Then type `git clone https://github.com/AquaQAnalytics/TorQ-Finance-Starter-Pack.git` and press *enter*.
- Close CMD. Then navigate to your directory using file-explorer. E.g. *Documents*. You should see the two folders here. Now create a new folder (button along bar at top of window) called *deploy*. This is from where the working TorQ Stack will run.
- First copy all the contents from within the *TorQ* folder to the *deploy* folder.
- Then copy all of the contents from *TorQ-Finance-Starter-Pack* to the *deploy* folder. You will be prompted to replace files. Click *Replace the files in this destination* for all cases.
- In the *deploy* folder, right click the `start_torq_demo.bat` file and click edit. This will open the file in Notepad.
- At the end of the line `set KDBBASEPORT=`, change the number to a port that is not directly in use, this will be a 4- or 5-digit number. Also make sure the 10 ports in front are also not in use (port number + 10). (Determining if a port is in use: *Windows key* [] -> “Resource monitor” -> Network -> Listening Ports). This could, likely, be left as default if this is your only TorQ Stack.
- Press *Ctrl + H* on the keyboard in notepad to open the *Replace*-window, Beside ‘Find what:’ type '`-U appconfig/passwords/accesslist.txt `' (**including the space at the end**), then beside ‘Replace with:’ leave blank. Then click ‘Replace All’. Then close the *Replace*-window and save and close the Notepad.
- In the ‘deploy’ folder, right click the `stop_torq_demo.bat` file and click edit. This will open the file in Notepad.
- At the end of the line `set KDBBASEPORT=`, change the number to the same port as the last file. Remember this number.
- Close notepad. Then double-click `start_torq_demo.bat`.
- Finally, initialise the TorQ stack to communicate with Grafana. Open CMD as Administrator as before. Then start a q-session by typing `q` and press *enter*. (If the following doesn't occur, review kdb+ installation instructions.) You should now see the q-prompt: `q)`
- Into the prompt, type ``h:hopen `::<KDBPORT>`` then press *enter*. Where the `<KDBPORT>` number is the process port to which you will connect from Grafana. This will be the number that you remembered before, but add 2 to it for connecting to the RDB. E.g ``h:hopen `::6002``.
- Into the prompt, type ``h".z.ws:{show -9!x;neg[.z.w] -8! @[value;-9!x;{`$\"'\",x}]}"``, then close the window and repeat the previous step and this step but adding 3 instead, this will be your HDB. Note these two ports down:
  - Tickerplant: `<KDBBASEPORT>` (E.g. `6000`)
  - RDB: `<KDBBASEPORT>`+2 (E.g. `6002`)
  - HDB: `<KDBBASEPORT>`+3 (E.g. `6003`)
- Your TorQ Stack is now operational and ready to connect. You may now proceed with the remaining steps of Initial Setup.

### Setup a TorQ Stack (Requires basic Linux knowledge)

- Boot a Linux machine running Ubuntu on the same network (and open a terminal).
- Install KDB+ using the instructions at the following link: https://code.kx.com/q/learn/install/linux/
- Change directory to the desired location for the installation of TorQ. (E.g. `cd /home/<USER>/`. Where `<USER>` is your account folder.) 
- Then type `git clone https://github.com/AquaQAnalytics/TorQ.git` and press *enter*. Then type `git clone https://github.com/AquaQAnalytics/TorQ-Finance-Starter-Pack.git` and press *enter*.
- Create new folder *deploy* using `mkdir deploy`.
- First copy the contents of the TorQ folder into the deploy folder: `cp -r ./TorQ/* ./deploy/`.
- Then copy the contents of the TorQ-Finance-Starter-Pack folder into the deploy folder: `cp -r ./TorQ-Finance-Starter-Pack/* ./deploy/`.
- Change directory to the deploy folder `cd deploy`
- Edit change the KDBBASEPORT number in `setenv.sh` file to a port of your choosing by using `vim setenv.sh` to open the file, then changing the number after `export KDBBASEPORT = ` to a port number of your choice. Note this port number – it will be needed for connecting from Grafana. Then save and exit file.
- Permissions are enabled but are not yet implemented in the KDB+ plugin. As a result, permissions will need to be disabled. Type `vim /appconfig/process.csv` then remove all instances of the following code: `${TORQHOME}/appconfig/passwords/accesslist.txt`. Be sure to leave the commas that are on either side. Then save and exit file.
- Type `./torq.sh start all`, press *enter*. Then type `./torq.sh summary` and press *enter*. Then you should see a table containing the running processes and associated ports that they are running on. Note down these port numbers, namely the rdb1 and hdb1 as these are most relevant. E.g.
```
TIME     | PROCESS        | STATUS | PID    | PORT
14:34:20 | discovery1     | up     | 29122  | 6001
14:34:20 | tickerplant1   | up     | 29213  | 6000
14:34:20 | rdb1           | up     | 29302  | 6002
14:34:20 | hdb1           | up     | 29393  | 6003
14:34:20 | hdb2           | up     | 29484  | 6004
…
```
- Finally, initialise the TorQ stack to communicate with Grafana. Start a q-session by typing `q` and press *enter*. (If the following doesn't occur, review kdb+ installation instructions.) You should now see the q-prompt: `q)`
- Into the prompt, type ``h:hopen `::<KDBPORT>`` then press *enter*. where the `<KDBPORT>` number is the process port to which you will connect from Grafana. E.g ``h:hopen `::6002``.
- Into the prompt, type ``h".z.ws:{show -9!x;neg[.z.w] -8! @[value;-9!x;{`$\"'\",x}]}"``. Repeat the previous step and this step but with the `<KDBPORT>` for a different process if/as needed.
- Your TorQ Stack is now operational and ready to connect. You may now proceed with the remaining steps of Initial Setup.
