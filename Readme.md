# Maintenance-Only Notice
**This plugin is deprecated and now in Maintenance Only mode. It will only be supported for critical bugs between Grafana versions 7.0.0 to 8.0.0. This plugin will remain available for current users as an End-of-Life product.**

**New users should instead use the [new kdb+ datasource plugin found here](https://grafana.com/grafana/plugins/aquaqanalytics-kdbbackend-datasource/).**

The new kdb+ datasource plugin's [GitHub page can be found here](https://github.com/AquaQAnalytics/grafana-kdb-backend-datasource).

# Grafana and KDB+ Plugin Installation Instructions

## Quick Install Guide

#### Installing Grafana:
 - If Grafana is not already installed, install Grafana from [grafana.com](https://grafana.com/grafana/download/) following the [installation guide](https://grafana.com/docs/grafana/latest/installation/) for the relevant operating system.

#### Installing kdb+ datasource plugin:
 - Download the [latest release](https://github.com/AquaQAnalytics/grafana-kdb-datasource-ws/releases/tag/v3.0.0).
 - Extract the entire *grafana-kdb-datasource-ws* folder to *{Grafana Install Directory}/grafana/data/plugins/*.
 - Start/restart the Grafana service (see **Grafana Service** below).
 
#### Configuring kdb+ instance:
Set the .z.ws WebSocket message handler on kdb+ instance as below:

``.z.ws:{ds:-9!x;neg[.z.w] -8! `o`ID!(@[value;ds[`i];{`$"'",x}];ds[`ID])}``

Ensure the kdb+ process has an [open listening port](https://code.kx.com/q/basics/listening-port/).

#### Adding datasource:
Navigate to the data-sources page in grafana (*default address: http://localhost:3000*) and click *Add data source*.
At the bottom of this page under *Others* should be *KDB+*, click on this to set settings.
*Host* should be only the address and port of the kdb+ instance given as:

`ADDRESS:PORT`

*'ws://' is not required, processes running on the same machine have `localhost` address.*

Default Timeout is how long in ms each query will wait for a response (will default to 5000 ms).

#### Authentication:
The plugin supports Basic authentication over insecure connections (not recommended) or secure WebSockets (recommended).
Insecure connections send all data (including user:password pairs) unencrypted.
Secure WebSockets require the kdb+ instance to be in [TLS mode](https://code.kx.com/q/kb/ssl/).
Note that some datasources will not work on Safari of IOS devices as unsecure authentication is being used

#### Security:
We **strongly** recommend running dedicated kdb+ instances only for grafana connections; no other services should operate from these instances.
If using in an open system we recommend running any kdb+ instances users can connect to as a seperate (non-root) user on the machine.
Do not allow this user to write to any directories or files on the machine.

Be aware the 'Free-form Query' 'Function' box and 'Built Query' 'Where' box allow users to run unfiltered commands on the kdb+ instance (including 'system' commands), so non-backed up system critical data should not be held on these instances and ideally only trusted users should be allowed to connect (see **Authentication**).

#### Supported Browsers:
Formally this adaptor has the same [compatibility as grafana](https://grafana.com/docs/grafana/latest/installation/requirements/),
however there are known bugs with lesser used browsers:
- Using authentication with Microsoft Edge is not supported.

We recommend using the latest version of either Google Chrome or Mozilla Firefox.

#### Time Zones:
Grafana time ranges have support for UTC time, local browser time or Grafana server time. As kdb+ does not have native time-zone support **all timestamps/datetimes in kdb+ are interpreted as UTC+0**. We recommend dashboards are set to UTC time to avoid confusion.

#### Grafana Service:
On **Windows** grafana will by default install itself as a service. To view running services, run:

`services.msc`

To start/stop/restart a service, right click on it and select the desired option. The Grafana service is named `Grafana`.

On **Linux** grafana will be installed as a service and can be controlled via `systemctl` commands:

`systemctl start grafana-server`

`systemctl stop grafana-server`

`systemctl restart grafana-server`



## Full Install/Setup Guide

- Install Grafana from [grafana.com](https://grafana.com/grafana/download/) following the installation guide for the relevant operating system.
- In your browser, navigate to [grafana-kdb-datasource-ws releases](https://github.com/AquaQAnalytics/grafana-kdb-datasource-ws/releases). Click on the latest release and click the ‘grafana-datasource-ws-X.0.0.zip’ link to download the plugin.
- Extract the zip file in *{Grafana Install Directory}\grafana\data\plugins*.
- Before moving on, check that the README.md is at the following location: *{Grafana Install Directory}\grafana\data\plugins\grafana-kdb-datasource-ws\README.md*.
- Open file-explorer and navigate into *{Grafana Install Directory}\data\plugins\grafana-kdb-datasource-ws* then right-click and cut the file named *custom.ini*. Then navigate into *C:\Program Files\GrafanaLabs\grafana\conf* then right-click and paste. Confirm that this file, *custom.ini*, is present at the following location : *C:\Program Files\GrafanaLabs\grafana\conf\.
- **Windows only**: Start grafana from an administrator-mode command line window:

`{Grafana Install Directory}\grafana\bin\grafana-server.exe`

- **Linux only**: Start the grafana-server instance:

`sudo systemctl start grafana-server`

- The Grafana server is now running. If using Windows the command-line window must remain operational to use Grafana. If it is closed and needs starting, repeat the previous step.
- Setup the kdb+ instance you wish to query as per **kdb+ Setup** below.
- Launch your browser (see **Supported Browsers**) and open Grafana by navigating to http://localhost:8080 and sign in using Usr:`admin` Pwd:`admin` (You will be prompted for changing password. *Skip*.)
- Click on the *cog* configuration icon on the left tab of the webpage, then click on the green *Add data source* button.
- Select *KDB+* under *Others* from the list.
- In the textbox that follows ‘Host’, type in the IP address followed by a colon, followed by the port. E.g. `localhost:6040` or `192.168.1.5:6789`. 

*N.B: If the kdb+ process is on the same machine as you are connecting from, use `localhost` as the IP address. If it's on the same internal network as you are connecting from, you can find it's IP address by running ipconfig (windows) or ifconfig (linux) on the host machine. If it's on an external network you will need to setup port forwarding (see your system administrator).*
- If authentication is present on the kdb+ process, select 'Use Authentication' and enter authentication details. If TLS is enabled on the kdb+ process select 'Use TLS' (see **Authentication**).
- Click the green *Save & Test* button to save and test the connection. The webpage will return a message depending on whether it was a success. If it cannot be connected, review each step again. If successful, you may now create a dashboard.

### kdb+ Setup

- Ensure the kdb+ process you wish to connect to [has an open port](https://code.kx.com/q/basics/listening-port/).
- Set the WebSocket message handler on this process (.z.ws) as shown below:

``.z.ws:{ds:-9!x;neg[.z.w] -8! `o`ID!(@[value;ds[`i];{`$"'",x}];ds[`ID])}``

- That's it! This kdb+ process should now be accessible to grafana. If the kdb+ process is on a different network to the network you are connecting from, you will need to setup port forwarding to the kdb+ process.


## New Features

#### Grafana Variables 

**Note: This feature is only supported on Grafana version 7.0.0 or later**

Support has been added for the use of Grafana variables in queries. These are implemented in much the same way that variables would be used in other datasources. Currently, there is support for variable types **query**, **custom** and **textbox**. To use Grafana variables in queries the syntax ${varname} is used. Grafana variables can be used in both the query builder and within free-form queries. The substitution of variables is done client side and precedes execution. You can see an example of how to make and use Grafana variables in this [demo video](https://vimeo.com/489410176).

Global Grafana variables may also be used within queries. There is currently support for `${__from}`, `${__to}`, `${__interval}` and global url variables.

#### Panel Plugin Support

The adaptor will be able to support all of Grafana 7's built in panel visualisations. In addition, external plugins that support Grafana 7 will also work with the adaptor. Panel plugins untested on Grafana 7 will potentially come with compatibillity issues if run on Grafana 7 or later - however they will work on the adaptor if an earlier compatible Grafana version is being used.   

#### Chained Variables

**Note: This feature is only supported on Grafana version 7.0.0 or later**

Support has been added for [Chained Variables](https://grafana.com/docs/grafana/v7.5/variables/variable-types/chained-variables/). To utilise chained variables you first create a variable as normal and then reference it when creating a new variable. This creates a parent-child relationship between variables.
To reference a variable within another variables query, you use the syntax $varname.

**Note the syntax differs from that used within the query builder and free-form queries, due to grafana restricting the '{}' characters within a variable query**
 
# Demo
### Setting up a demo TorQ Stack (Windows)

- [Install TorQ](https://github.com/AquaQAnalytics/TorQ) and [TorQ Finance starter pack](https://github.com/AquaQAnalytics/TorQ-Finance-Starter-Pack) as described [on the AquaQ wiki](https://aquaqanalytics.github.io/TorQ/gettingstarted/).
- In the *deploy* folder, right click the `start_torq_demo.bat` file and click edit. This will open the file in Notepad.
- At the end of the line `set KDBBASEPORT=`, change the number to a port that is not directly in use, this will be a 4- or 5-digit number (as an example we will use 6000). Also make sure the 20 ports in front are also not in use (port number + 20). Save and exit.
- In the ‘deploy’ folder, right click the `stop_torq_demo.bat` file and click edit. This will open the file in Notepad.
- At the end of the line `set KDBBASEPORT=`, change the number to the same port as the last file. Remember this number.
- Close notepad. Then double-click `start_torq_demo.bat`.
- Start a q session and into the prompt, type ``h:hopen `::<KDBBASEPORT+2>`` where `KDBBASEPORT+2` is the base port you set in start_torq_demo.bat plus 2 (for our example this would be 6002), then press *enter*. This will open a handle between this current q session and our TorQs stack RDB.
- Into the prompt, type ``h".z.ws:{ds:-9!x;neg[.z.w] -8! `o`ID!(@[value;ds[`i];{`$\"'\",x}];ds[`ID])}"``, then close the window and repeat the previous step and this step but using KDBBASEPORT + 3 instead; this will be your HDB. Note these two ports down:
  - RDB: `<KDBBASEPORT>`+2 (E.g. `6002`)
  - HDB: `<KDBBASEPORT>`+3 (E.g. `6003`)
- To connect these processes to grafana, add a data-source as explained in **Initial Setup** with the 'Host' being `localhost:KDBBASEPORT+2` where `KDBBASEPORT+2` is the port the RDB is running on.
- Select *Use Authentication* and deselect *Use TLS*.
- In the `user` box type `admin`. In the `password` box type `admin`.
- Click *Save & Test* and a green notification box should appear to tell you the connection was successful.
- Repeat the previous 4 steps with `KDBBASEPORT+3` to connect the HDB.


# Building the plugin
### Build Dependencies:
 - [yarn](https://classic.yarnpkg.com/lang/en/docs/install/)

**Please note that while you can build the plugin yourself, it will not be signed. Later versions of Grafana will not load unsigned plugins unless you configure it to do so.
Signing plugin requires a GRAFANA_API_KEY environment variable to be set, the value of which is restricted to admins of the AquaQ grafana account. To load an unsigned plugnin see [here](https://grafana.com/docs/grafana/latest/plugins/plugin-signatures/#allow-unsigned-plugins)**

To build the plugin you need to run the following commands. 

```
yarn install
yarn build
```

This will create a 'dist' directory at the root of your repo. You can then import this into your grafana instance, by adding it to a folder within the grafana plugins directory

For example - .../GrafanaLabs/grafana/data/plugins/kdb - so your dist dir would exist at - .../GrafanaLabs/grafana/data/plugins/kdb/dist

