function MakeVariables()
{
  Indicator.Hide();
  //Opens the specified URL in a running instance of the specified browser.
  Browsers.Item(btChrome).Navigate("http://localhost:8080/");
  //Delays the test execution for the specified time period.
  Delay(5000);
  //Clicks the 'vg' object.
  Aliases.browser.pageHomeGrafana.link.vg.Click(3, 10);
  //Waits until the browser loads the page and is ready to accept user input.
  Aliases.browser.pageHomeGrafana.Wait();
  //Clicks the 'textnode' object.
  Aliases.browser.pageHomeGrafana.textnode.Click(50, 11);
  //Waits until the browser loads the page and is ready to accept user input.
  Aliases.browser.pageHomeGrafana.Wait();
  //Clicks the 'vg' object.
  Aliases.browser.pageHomeGrafana.vg.Click(9, 11);
  //Waits until the browser loads the page and is ready to accept user input.
  Aliases.browser.pageHomeGrafana.Wait();
  //Clicks the 'link2' link.
  Aliases.browser.pageHomeGrafana.link2.Click();
  //Waits until the browser loads the page and is ready to accept user input.
  Aliases.browser.pageHomeGrafana.Wait();
  //Clicks the 'textnode2' object.
  Aliases.browser.pageHomeGrafana.textnode2.Click(49, 23);
  //Delays the test execution for the specified time period.
  Delay(3000);
  //Clicks the 'textboxName' object.
  Aliases.browser.pageHomeGrafana.form.textboxName.Click(84, 17);
  //Sets the text 'targetsym' in the 'textboxName' text editor.
  Aliases.browser.pageHomeGrafana.form.textboxName.SetText("targetsym");
  //Selects the 'kdb+' item of the 'select' combo box.
  Aliases.browser.pageHomeGrafana.form.select.ClickItem("kdb+");
  //Clicks the 'textarea' object.
  Aliases.browser.pageHomeGrafana.form.textarea.Click(119, 19);
  //Enters 'exec distinct sym from statictab' in the 'textarea' object.
  Aliases.browser.pageHomeGrafana.form.textarea.Keys("exec distinct sym from statictab");
  //Delays the test execution for the specified time period.
  Delay(2000);
  //Clicks the 'form' object.
  Aliases.browser.pageHomeGrafana.form.Click(366, 546);
  //Clicks the 'buttonAdd' button.
  Aliases.browser.pageHomeGrafana.form.buttonAdd.ClickButton();
  //Clicks the 'buttonNew' button.
  Aliases.browser.pageHomeGrafana.buttonNew.ClickButton();
  //Clicks the 'textboxName' object.
  Aliases.browser.pageHomeGrafana.form.textboxName.Click(57, 7);
  //Sets the text 'columns' in the 'textboxName' text editor.
  Aliases.browser.pageHomeGrafana.form.textboxName.SetText("columns");
  //Selects the 'kdb+' item of the 'select' combo box.
  Aliases.browser.pageHomeGrafana.form.select.ClickItem("kdb+");
  //Clicks the 'textarea' object.
  Aliases.browser.pageHomeGrafana.form.textarea.Click(67, 19);
  //Enters '(cols statictab) except `time`sym`side' in the 'textarea' object.
  Aliases.browser.pageHomeGrafana.form.textarea.Keys("(cols statictab) except `time`sym`side");
  //Delays the test execution for the specified time period.
  Delay(2000);
  //Clicks the 'form' object.
  Aliases.browser.pageHomeGrafana.form.Click(361, 360);
  //Clicks the 'buttonAdd' button.
  Aliases.browser.pageHomeGrafana.form.buttonAdd.ClickButton();
  //Clicks the 'buttonNew' button.
  Aliases.browser.pageHomeGrafana.buttonNew.ClickButton();
  //Clicks the 'textboxName' object.
  Aliases.browser.pageHomeGrafana.form.textboxName.Click(58, 16);
  //Sets the text 'buckets' in the 'textboxName' text editor.
  Aliases.browser.pageHomeGrafana.form.textboxName.SetText("buckets");
  //Delays the test execution for the specified time period.
  Delay(1000);
  //Selects the 'Custom' item of the 'select2' combo box.
  Aliases.browser.pageHomeGrafana.form.select2.ClickItem("Custom");
  //Delays the test execution for the specified time period.
  Delay(2000);
  //Clicks the 'textbox' object.
  Aliases.browser.pageHomeGrafana.form.textbox.Click(27, 9);
  //Sets the text '1,2,5,10,20,30,60' in the 'textbox' text editor.
  Aliases.browser.pageHomeGrafana.form.textbox.SetText("1,2,5,10,20,30,60");
  //Delays the test execution for the specified time period.
  Delay(2000);
  //Clicks the 'form' object.
  Aliases.browser.pageHomeGrafana.form.Click(286, 267);
  //Clicks the 'buttonAdd' button.
  Aliases.browser.pageHomeGrafana.form.buttonAdd.ClickButton();
  //Delays the test execution for the specified time period.
  Delay(3000);
  //Clicks the 'vg3' object.
  Aliases.browser.pageHomeGrafana.vg3.Click(23, 19);
  //Waits until the browser loads the page and is ready to accept user input.
  Aliases.browser.pageHomeGrafana.Wait();
}

function UseVariables()
{
  Indicator.Hide();
  //Selects the 'Free-form Query' item of the 'select' combo box.
  Aliases.browser.pageHomeGrafana.select.ClickItem("Free-form Query");
  //Clicks the 'textarea' object.
  Aliases.browser.pageHomeGrafana.textarea.Click(96, 13);
  //Enters 'select time, ${columns} from statictab where sym=`${targetsym}' in the 'textarea' object.
  Aliases.browser.pageHomeGrafana.textarea.Keys("select time, ${columns} from statictab where sym=`${targetsym}");
  //Clicks the 'panel' object.
  Aliases.browser.pageHomeGrafana.panel.Click(113, 21);
  //Clicks the 'textbox' object.
  Aliases.browser.pageHomeGrafana.textbox.Click(41, 16);
  //Sets the text 'time' in the 'textbox' text editor.
  Aliases.browser.pageHomeGrafana.textbox.SetText("time");
  //Clicks the 'panel' object.
  Aliases.browser.pageHomeGrafana.panel.Click(131, 72);
  //Delays the test execution for the specified time period.
  Delay(4000);
  //Sets the state of the 'checkboxUseConflation' checkbox to True.
  Aliases.browser.pageHomeGrafana.checkboxUseConflation.ClickChecked(true);
  //Delays the test execution for the specified time period.
  Delay(2000);
  //Clicks the 'link3' link.
  Aliases.browser.pageHomeGrafana.link3.Click();
  //Sets the text '${buckets}' in the 'textbox2' text editor.
  Aliases.browser.pageHomeGrafana.textbox2.SetText("${buckets}");
  //Clicks the 'panel2' object.
  Aliases.browser.pageHomeGrafana.panel2.Click(285, 20);
  //Clicks the 'buttonShowOptions' button.
  Aliases.browser.pageHomeGrafana.buttonShowOptions.ClickButton();
  //Clicks the 'panel' object.
  Aliases.browser.pageHomeGrafana.panel22.panel.Click(47, 11);
  //Clicks the 'textbox' object.
  Aliases.browser.pageHomeGrafana.panel22.textbox.Click(93, 14);
  //Sets the text 'Avg ${columns} - ${targetsym}' in the 'textbox' text editor.
  Aliases.browser.pageHomeGrafana.panel22.textbox.SetText("Avg ${columns} - ${targetsym}");
  //Delays the test execution for the specified time period.
  Delay(3000);
  //Clicks the 'panel' object.
  Aliases.browser.pageHomeGrafana.panel22.panel.Click(116, 10);
  //Clicks the 'button' button.
  Aliases.browser.pageHomeGrafana.button.ClickButton();
  //Delays the test execution for the specified time period.
  Delay(3000);
  //Clicks the 'textnode4' object.
  Aliases.browser.pageHomeGrafana.textnode4.Click(31, 10);
  //Enters '[Down][Down][Enter]' in the 'textbox9' object.
  Aliases.browser.pageHomeGrafana.textbox9.Keys("[Down][Down][Enter]");
  //Waits until the browser loads the page and is ready to accept user input.
  Aliases.browser.pageHomeGrafana.Wait();
  //Clicks the 'textnode' object.
  Aliases.browser.pageHomeGrafana.link4.textnode.Click(16, 11);
  //Enters '[Down][Down][Down][Down][Enter]' in the 'textbox4' object.
  Aliases.browser.pageHomeGrafana.textbox4.Keys("[Down][Down][Down][Down][Enter]");
  //Waits until the browser loads the page and is ready to accept user input.
  Aliases.browser.pageHomeGrafana.Wait();
  //Clicks the 'textnode' object.
  Aliases.browser.pageHomeGrafana.link5.textnode.Click(3, 10);
  //Enters '[Down][Down][Down][Down][Enter]' in the 'textbox5' object.
  Aliases.browser.pageHomeGrafana.textbox5.Keys("[Down][Down][Down][Down][Enter]");
  //Waits until the browser loads the page and is ready to accept user input.
  Aliases.browser.pageHomeGrafana.Wait();
  //Delays the test execution for the specified time period.
  Delay(5000);
  //Clicks the 'wndChrome_WidgetWin_1' object.
  Aliases.browser.wndChrome_WidgetWin_1.Click(356, 37);
  //Clicks the 'wndChrome_WidgetWin_1' object.
  Aliases.browser.wndChrome_WidgetWin_1.Click(490, 151);
  //Clicks the 'textnode' object.
  Aliases.browser.pageHomeGrafana.link6.textnode.Click(14, 10);
  //Enters '[Down][Down][Down][Enter]' in the 'textbox10' object.
  Aliases.browser.pageHomeGrafana.textbox10.Keys("[Down][Down][Down][Enter]");
  //Waits until the browser loads the page and is ready to accept user input.
  Aliases.browser.pageHomeGrafana.Wait();
  //Delays the test execution for the specified time period.
  Delay(2000);
  //Clicks the 'textnode' object.
  Aliases.browser.pageHomeGrafana.link7.textnode.Click(23, 11);
  //Enters '[Down][Down][Down][Down][Enter]' in the 'textbox10' object.
  Aliases.browser.pageHomeGrafana.textbox10.Keys("[Down][Down][Down][Down][Enter]");
  //Waits until the browser loads the page and is ready to accept user input.
  Aliases.browser.pageHomeGrafana.Wait();
  //Delays the test execution for the specified time period.
  Delay(2000);
  //Clicks the 'textnode' object.
  Aliases.browser.pageHomeGrafana.link8.textnode.Click(15, 9);
  //Enters '[Down][Down][Down][Down][Enter]' in the 'textbox7' object.
  Aliases.browser.pageHomeGrafana.textbox7.Keys("[Down][Down][Down][Down][Enter]");
  //Waits until the browser loads the page and is ready to accept user input.
  Aliases.browser.pageHomeGrafana.Wait();
  //Delays the test execution for the specified time period.
  Delay(2000);
  //Clicks the 'textnode2' object.
  Aliases.browser.pageHomeGrafana.link8.textnode2.Click(15, 9);
  //Enters '[Down][Down][Down][Down][Down][Down][Enter]' in the 'textbox7' object.
  Aliases.browser.pageHomeGrafana.textbox7.Keys("[Down][Down][Down][Down][Down][Down][Enter]");
  //Waits until the browser loads the page and is ready to accept user input.
  Aliases.browser.pageHomeGrafana.Wait();
  //Delays the test execution for the specified time period.
  Delay(2000);
  //Clicks the 'textnode' object.
  Aliases.browser.pageHomeGrafana.link9.textnode.Click(5, 9);
  //Enters '[Down][Down][Down][Down][Up][Enter]' in the 'textbox8' object.
  Aliases.browser.pageHomeGrafana.textbox8.Keys("[Down][Down][Down][Down][Up][Enter]");
  //Waits until the browser loads the page and is ready to accept user input.
  Aliases.browser.pageHomeGrafana.Wait();
  //Delays the test execution for the specified time period.
  Delay(2000);
  //Clicks the 'textnode2' object.
  Aliases.browser.pageHomeGrafana.link9.textnode2.Click(5, 9);
  //Enters '[Down][Down][Down][Down][Down][Down][Enter]' in the 'textbox8' object.
  Aliases.browser.pageHomeGrafana.textbox8.Keys("[Down][Down][Down][Down][Down][Down][Enter]");
  //Waits until the browser loads the page and is ready to accept user input.
  Aliases.browser.pageHomeGrafana.Wait();
  //Delays the test execution for the specified time period.
  Delay(10000);
}