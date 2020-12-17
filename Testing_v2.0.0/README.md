# Automated Testing Instructions - with TestComplete

- Download both folders in this sub-directory. To run the tests as is, you must place the "Grafana Adaptor" folder in the C drive. The "GrafanaTesting" folder can be placed anywhere.
- Ensure that Grafana is running with the Kdb+ Plugin v2.0.0 installed.
- Load up the TestComplete project within the TestComplete app, select run project and wait for the tests to finish running.
- The "Grafana Adaptor" folder contains a batch file that is used to initialize the database for these tests. Instead of placing this folder in the C-Drive, you can also manually start the database by double clicking the batch file. 
- If you manually start the database, you must navigate to the GrafanaTesting v2.0 project test suite within the TestComplete app and deselect the "StartUpTest" keyword test before running the project. Otherwise the tests will begin by trying to initialize the database, will fail to do so, and the test run will stop. 

These tests were made using Grafana version 7.2.1, using TestComplete version 14.61.294. Major updates to Grafana (particularly updates which change the Grafana layout) may cause some of these tests to fail.
