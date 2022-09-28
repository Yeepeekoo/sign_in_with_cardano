import {Component} from "react";

class ViewHeader extends Component {

/*
 *      UI 
 */

    render() {
        return (
            <div className="siww-header">
                <div className={"siww-panel " + (this.props.theme.webapp.dark_mode? this.props.theme.webapp.dark_mode : '')}>
                    {this.props.isOauth ?
                    <>
                        <div className="display-app-logo">
                            <img className="client-login-logo" src={this.props.theme.webapp.logo} alt="logo" />
                            <div className="login-subtitle">
                                <span>{this.props.oauthClientName}</span>
                                <br />
                                <span>{this.props.oauthDomain}</span>
                            </div>
                        </div>
                        <div className="login-separator">↔</div>
                        <div className="hidden" id="idClient">{this.props.client_id}</div>
                    </>
                    :""}

                    <div className="display-app-logo">
                        <img className="client-login-logo" src={this.props.SIWCLogo} alt="logo"/>
                        <div className="login-subtitle">Sign-in with<br />{this.props.theme.name}</div>
                    </div>
                </div>
            </div>
        )
    }
}

export default ViewHeader;