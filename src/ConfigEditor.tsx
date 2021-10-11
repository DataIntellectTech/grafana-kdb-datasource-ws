import React, { ChangeEvent, PureComponent } from 'react';
import { Alert, Checkbox, LegacyForms, } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { MyDataSourceOptions } from './types';

const {  FormField } = LegacyForms;

interface Props extends DataSourcePluginOptionsEditorProps<MyDataSourceOptions> {}

type State = {
  authChecked: boolean;
  tlsChecked: boolean;
};

export class ConfigEditor extends PureComponent<Props, State> {

  constructor(props: Props){
    super(props);
    this.state = {
      authChecked: props.options.jsonData.useAuthentication ? true : false,
      tlsChecked: props.options.jsonData.useTLS ? true : false,
    }
    
  }

  onHostChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      host: event.target.value,
    };
    onOptionsChange({ ...options, jsonData });
  };

  onTimoutChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      timeoutLength: event.target.value,
    };
    onOptionsChange({ ...options, jsonData });
  };

  useAuthentication = (checked: boolean) => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      useAuthentication: checked,
    };
    this.setState({ authChecked: checked }, () => {
      onOptionsChange({ ...options, jsonData });
    })
  };

  useTLS = (checked: boolean) => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      useTLS: checked,
    };
    this.setState({ tlsChecked: checked }, () => {
      onOptionsChange({ ...options, jsonData });
    })
  };

  onUserChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      user: event.target.value,
    };
    onOptionsChange({ ...options, jsonData });
  };
  onPassChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      password: event.target.value,
    };
    onOptionsChange({ ...options, jsonData });
  };

  render() {
    const { options } = this.props;
    const { jsonData } = options;

    return (
      <div className="gf-form-group">
        <h3>KDB+ Connection</h3>
        <div className="gf-form">
          <FormField
            label="Host"
            labelWidth={11}
            inputWidth={30}
            onChange={this.onHostChange}
            value={jsonData.host || ''}
            placeholder="address:port"
          />
        </div>

        <div className="gf-form-inline">
          <div className="gf-form">
            <FormField
              value={jsonData.timeoutLength || ''}
              label="Default Timeout"
              placeholder="5000"
              labelWidth={11}
              inputWidth={15}
              onChange={this.onTimoutChange}
            />
          </div>
        </div>
        <div className="gf-form-inline">
          <label className="gf-form-label width-11">
            <Checkbox
              label="Use Authentication"
              checked={this.state.authChecked}
              onChange={(e) => this.useAuthentication(e.currentTarget.checked)}
              css=""/>
          </label>
          {this.state.authChecked && (
            <label className="gf-form-label width-11">
            <Checkbox
              label="Use TLS Encyrption"
              checked={this.state.tlsChecked}
              onChange={(e) => this.useTLS(e.currentTarget.checked)}
              css=""/>
           </label>
          )}
        </div>
        <div className="gf-form-group">
            {this.state.authChecked && !this.state.tlsChecked && (
              <Alert
                title={"Connection Insecure"}
                severity={"error"}
                >
                <br/>
                <p>                  
                Connecting over authorised WebSockets without TLS enabled will transmit all information including 
                <strong style={{color: 'red'}}> username-password pairs in clear text</strong>. We <strong>highly</strong> recommend if using authorisation that TLS is enabled. The KDB+ 
                server is also required to have TLS enabled for secure WebSockets to connect.  
                <p>
                  See the <a className="external-link" target="_blank" href="https://code.kx.com/q/kb/ssl/">kx wiki SSL/TLS page</a> for more information.
                </p>
                </p>
              </Alert>
            )}
            {this.state.authChecked && this.state.tlsChecked && (
              <Alert
                title={"TLS Enabled"}
                severity={"success"}
                >
                <br/>
                <p>

                Connecting over TLS requires the KDB+ server to be in TLS mode and for its certificate to be valid. 
                Self-signed certificates can be added to the browser's exception list on a browser-by-browser basis.
                An example of how to do this <a className="external-link" target="_blank" href="https://it.nmu.edu/docs/adding-security-exception-your-browser">is provided here.</a>
                </p>                
                <p>
                  See the <a className="external-link" target="_blank" href="https://code.kx.com/q/kb/ssl/">kx wiki SSL/TLS page</a> for more information.
                </p>
              </Alert>
            )}
            {this.state.authChecked && (
            <div>
                <FormField
                label="User"
                labelWidth={11}
                inputWidth={30}
                onChange={this.onUserChange}
                value={jsonData.user || ''}
                placeholder="user"
                />
                <FormField
                label="password"
                labelWidth={11}
                inputWidth={30}
                type="password"
                onChange={this.onPassChange}
                value={jsonData.password || ''}
                placeholder="password"
                />
              </div>
            )}
        </div>
      </div>
    );
  }
}
