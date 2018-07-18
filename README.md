# Climber Custom Report
<a href="https://github.com/ClimberAB/ClimberCustomReport/releases/download/v2.2.0/cl-custom-report-v2.2.0.zip" target="_blank"><img src="./screenshots/downloadbutton.png?raw=true" 
alt="Download latest release" width="400" height="40" border="0" /></a>  
 ### Self service without edit-mode for Qlik Sense!  

<img src="./screenshots/CustomReport.gif?raw=true" alt="Custom Report" />

## Purpose and Description
**IMPORTANT! Any older Custom Report objects need to be recreated with version 2.0!**

In QlikView we saw a lot of users requesting a customizable straight table. In Qlik Sense we have created something even better! The Custom Report extension allows the user to create custom tables based on data in master tables. 

With Custom Report + you can create your own personalized bookmarks and add shareable presets for your reports. In Custom Report + we have also extended the visualization types to include pivot tables and combo charts (more details below). 

First thing to do is create a simple straight table and make it a master item. The table is will now be accessible in Custom Report and you can select to show any or all measures and dimensions. Number format follows from the master item so no need to redo formatting! 

**Tested with Qlik Sense November 2017 and later**

## Custom Report vs Custom Report +

<img src="./screenshots/CustomReport+.png?raw=true" alt="CustomReport+"/>

For more information about Custom Report + and our subscription model please check out our extension <a href="https://www.climber.se/erbjudande/verktyg/climber-extensions-for-qlik-sense/"> page </a>.

## Setup

1. Create one or more Master Item Tables with the dimensions and measures you want to visualize.   
  
2. Select Master Item in the drop-down or drag and drop it on the visualization

<img src="./screenshots/AddnewDataSet.gif?raw=true" alt="Add new Data Set to Custom Report" />

## Defaults, presets and bookmarks

### Default states

All added data sets can have a default state when a new session is opened, i.e. preselected dimensions and measures. Even the table column widths are saved in the state. It is recommended to always set a default state so the user does not have to start with an empty table.

To create a new default state for a dataset go in to edit mode. Select your measures/dimensions you want to set in you default state and click "Save default state". After you added a default state you can always show your current default state by clicking on the button "show default state". 

To change your default state, just make your new selections and click "Save default state" again.

-Save default state
<img src="./screenshots/DefaultState.png?raw=true" alt="Default State" /> 

-Show default state
<img src="./screenshots/ShowDefaultState.png?raw=true" alt="Show Default State" />   

### Session

Within a session, all selections between the data sets will be saved, i.e. the default state will not be followed once the session is started. This makes it possible to easily change between data sets without losing the last state.

### Presets (Custom Report+)

It is possible for the developer/super users to create presets (i.e. a saved state). Presets will be accessible for all users in the application. This can be used for creating predefined reports.

Presets are accessible from the drop down of data sets 

<img src="./screenshots/Presets.png?raw=true" alt="Presets" /> 

To create a preset select your dimensions/measures and go in to edit mode. Click on "presets" and click on "Add Preset". To change a preset, change your selections and click "Save preset". 

You can always show a current preset by clicking "show preset" 

<img src="./screenshots/PresetsCreate.png?raw=true" alt="PresetsCreate" />

### Bookmarks (Custom Report+)
For the end user is possible to create personalized bookmarks. With bookmarks you can save a state and go back to that state using the standard Qlik Sense bookmark list. 

How to use bookmarks

1. Enable bookmarks in Custom Report Object

<img src="./screenshots/EnableBookmarks.png?raw=true" alt="Enable Bookmarks" />

2. Use the bookmark creator <a href="https://help.qlik.com/en-US/sense/2.1/Subsystems/Hub/Content/Bookmarks/create-bookmark.htm"> How to create a bookmark </a>

<img src="./screenshots/CreateBookmarks.png?raw=true" alt="Create Bookmark" />

3. Access the bookmarks 

<img src="./screenshots/AccessBookmarks.png?raw=true" alt="Access Bookmark" />

*Note!* To support bookmarks using the Qlik Sense standard functionality, the extension use variables starting with "ClimberCustomReport". If you accidently delete the variable, entering Edit mode will recreate it if the app is not published. Variables are not automatically deleted.

## Sort Bar

With the sort bar you can change the order of the dimensions and measures. It is possible to hide the sort bar for different visualizations types. 

*From QS February 2018 it's possible to change column order in a table by dragging in the column header so typically a straight table does not need the Sort Bar*

<img src="./screenshots/SortBar.gif?raw=true" alt="SortBar" />

<img src="./screenshots/HideTheSortBar.png?raw=true" alt="Hide the SortBar" />

## Other options

1. The objects used are standard Qlik Sense objects so all standard features such as export and sorting are available (Export to image/pdf does not work. See limitations below.)

2. Using a minimized version of the object you can put a custom report on any sheet along with the rest of the visualizations. Click arrows to expand to full screen!  

3. Right-click menu allows you to make changes even with fields/sortbar hidden  

4. Search in dimensions and measure list

5. Clear all selections

6. Add totals to table/pivot table
<img src="./screenshots/AddTotals.png?raw=true" alt="AddTotals" />

## Export to new application

It is possible to export the current state of a selected data set to a new application. In the new application, master items will be created from your dimension and measures.

<img src="./screenshots/ExporttonewApp.gif?raw=true" alt="ExporttonewApp" />

## Export to new application using a template (Custom Report+)

To enable this feature, enable experimental features in the extension settings (Appearance\Settings). 

## Installation

1. Download the latest version of Qlik Sense (QS November 2017 or higher)
2. Qlik Sense Desktop
    * To install, copy all files in the .zip file to folder "C:\Users\\[%Username%]\Documents\Qlik\Sense\Extensions\cl-customreport\"
3. Qlik Sense Server
    * See instructions <a href="http://help.qlik.com/en-US/sense/Subsystems/ManagementConsole/Content/import-extensions.htm"> how to import an extension on Qlik Sense Server </a>

## Climber Extensions
Like this extension? Check out the other Climber extensions below or visit <a href="http://www.climberextensions.com"> climberextensions.com </a> for more information about our extensions offerings.

**Finance Report (P&L)**
* https://www.youtube.com/watch?v=xOfShi94T4k
(No free version available, only on subscription.)

**Container**
* https://github.com/ClimberAB/ClimberContainer

**Selection Bar**
* https://github.com/ClimberAB/ClimberSelectionBar
* https://www.youtube.com/watch?v=4fxrphADRKw

**KPI**
* https://github.com/ClimberAB/ClimberKPI
* https://www.youtube.com/watch?v=9zdfYshNel4

**Cards**
* https://github.com/ClimberAB/ClimberCards
* https://www.youtube.com/watch?v=k_IEt8TvB_c

## Limitations

1. No pdf/png export supported. (This also means no Nprinting support.)
2. Calculation conditions in master items are not respected
3. Master measure/dimension colors not respected
4. A very small (collapsed) version of the extension could look nicer :-)
5. Export to template only works in Qlik Sense Enterprise
6. Unpublished sheets in a published app can't use Bookmarks

**Climber**
* http://github.com/ClimberAB

## Change Log

See <a href="CHANGELOG.md"> CHANGELOG </a>

## License

See <a href="License.pdf"> LICENSE </a>


