# Grafana and KDB+ Plugin Installation Instructions

### Initial Setup

- You must be on an Administrator account on a Windows 64-bit computer.
- Install node and npm in order to build the plugin. Visit https://www.npmjs.com/get-npm and select the *Download Node.js and npm* download button.
- Click the LTS download for most users. Then install with default settings to default location **except on the 5th pane, select “Automatically install the necessary tools. Note this will also install Chocolatey”** then click *Next*, then *Install*. This may take some time, wait until complete.
- Install [GIT for windows](https://git-scm.com/downloads). Under *Downloads*, click ‘Windows’. Then the download should then start.
- Run the installation and use default settings **except on the 8th pane, select “Use Windows’ default console window”** then click *Next*, then *Install*.
- Install version **6.5.3** of Grafana for **Windows** from [grafana.com](https://grafana.com/grafana/download/6.5.3?platform=windows) and click ‘Download the installer’ under *Windows Installer*. Then run the program and install using all default settings. 
- In your browser, navigate to https://github.com/AquaQAnalytics/kdb-datasource/releases. Click on the latest release and click the ‘Source code (zip)’ link to download the plugin.
- Move the zip file to *C:\program files\grafanalabs\grafana\data\plugins* then right click and select *Extract All…* then change the target directory to *C:\program files\grafanalabs\grafana\data\plugins* then click *Extract*.
- Before moving on, check that the README.md is at the following location: *C:\program files\grafanalabs\grafana\data\plugins\kdb-datasource-`<VERSION>`\README.md*. (Where `<VERSION>` is the current version code of the plugin. e.g. `0.0.03`)
- Open CMD by pressing the *windows key* [] (or start button) then type ‘CMD’ then right click the application and click *Run as Administrator*.
- Then use the change directory command `cd C:\program files\grafanalabs\grafana\data\plugins\` to navigate to the plugin location. 
- Then use it again to open the kdb-datasource folder; `cd kdb-datasource-<VERSION>` (where `<VERSION>` is the current version code of the plugin e.g. `cd kdb-datasource-0.0.03`)
- Type `npm install -g grunt -cli` and press *enter*. Wait until it is installed.
- Type `npm install` and press *enter*. Wait until installed.
- Type `grunt` and press *enter*. Wait until it has completed.
- Open file-explorer and navigate into *C:\program files\grafanalabs\grafana\data\plugins\kdb-datasource-`<VERSION>`* then right-click and cut the file named *custom*. Then navigate into *C:\Program Files\GrafanaLabs\grafana\conf* then right-click and paste. Confirm that this file, *custom*, is present at the following location : *C:\Program Files\GrafanaLabs\grafana\conf\.
- Reopen CMD as before, change directory once more using `cd C:\program files\grafanalabs\grafana\bin`, then type `grafana-server.exe` and press *enter*.
- This CMD window is now running the Grafana server. It must remain operational to use Grafana. If it is closed and needs starting, only repeat the previous step from now on.
- Launch your browser (e.g. Chrome or Edge) then use the following URL to open Grafana: [localhost:8080/](localhost:8080/) and sign in using Usr:`admin` Pwd:`admin` (You will be prompted for changing password. *Skip*.)
- If you currently do not have a KDB+ session to connect, go to the Setup a TorQ Stack section of these instructions to create a session that simulates a financial data capture system. Proceed to next step if there is already a session, to which you will connect, on your network.
- Once you have setup your KDB+ data source, your IP-address will be `localhost` and you should have a port corresponding to the process whose data you will be visualising. If you already have a session on your network, you should have the IP-address (numbers separated by full stops) and the port number (usually a 4- or 5-digit number).
- Go to your Grafana instance on your browser by navigating to [localhost:8080/](localhost:8080/) as before. Click on the *cog* configuration icon on the left tab of the webpage, then click on the green *Add data source* button.
- Select *KDB+* from the list.
- In the textbox that follows ‘Host’, type in the IP address followed by a colon, followed by the port. E.g. `localhost:6002` or `192.168.1.48:6002`
- Click the green *Save & Test* button to save and test the connection. The webpage will return a message depending on whether it was a success. If cannot be connected, then review each step again. If success, you may now create a dashboard in Grafana visualising real time KDB+ data.

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
