import EventBus from 'eventing-bus';
import React from "react";
import { connect } from 'react-redux';
import classNames from "classnames";

// reactstrap components
import {
  Collapse,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  UncontrolledDropdown,
  Input,
  NavbarBrand,
  Navbar,
  NavLink,
  Nav,
  Container,
  Modal
} from "reactstrap";

import './index.css';
import { logout } from '../../store/actions/Auth';
// import { web3 } from '../../store/web3';

class AdminNavbar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      collapseOpen: false,
      modalSearch: false,
      color: "navbar-transparent",
      role: localStorage.getItem('role'),
    };
  }
  async componentDidMount() {
    window.addEventListener("resize", this.updateColor);
    // SET ADDRESS
    // let address = (await web3.currentProvider.enable())[0];
    // this.props.setAddress(address)
  }
  componentWillUnmount() {
    window.removeEventListener("resize", this.updateColor);
  }

  // function that adds color white/transparent to the navbar on resize (this is for the collapse)
  updateColor = () => {
    if (window.innerWidth < 993 && this.state.collapseOpen) {
      this.setState({
        color: "bg-white"
      });
    } else {
      this.setState({
        color: "navbar-transparent"
      });
    }
  };
  // this function opens and closes the collapse on small devices
  toggleCollapse = () => {
    if (this.state.collapseOpen) {
      this.setState({
        color: "navbar-transparent"
      });
    } else {
      this.setState({
        color: "bg-white"
      });
    }
    this.setState({
      collapseOpen: !this.state.collapseOpen
    });
  };
  // this function is to open the Search modal
  toggleModalSearch = () => {
    this.setState({
      modalSearch: !this.state.modalSearch
    });
  };

  logout = () => {
    this.props.logout();
    this.props.history.push('/');
  };

  copied = () => EventBus.publish("success", 'Address is Copied');

  render() {
    let { role } = this.state;
    let { address, balance } = this.props;
    return (
      <div className="nav-bar">
        <Navbar
          className={classNames("navbar-absolute", this.state.color)}
          expand="lg"
        >
          <Container fluid>
            <div className="navbar-wrapper">
              <div
                className={classNames("navbar-toggle d-inline", {
                  toggled: this.props.sidebarOpened
                })}
              >
                <button
                  className="navbar-toggler"
                  type="button"
                  onClick={this.props.toggleSidebar}
                >
                  <span className="navbar-toggler-bar bar1" />
                  <span className="navbar-toggler-bar bar2" />
                  <span className="navbar-toggler-bar bar3" />
                </button>
              </div>
              <NavbarBrand className="mt-2" href="#" target="_blank">
                {/* <img alt="..." src={require('../../assets/img/logo.png')} style={{ width: '70%', padding: '20px' }} /> */}
              </NavbarBrand>
            </div>
            <Collapse navbar isOpen={this.state.collapseOpen}>
              <Nav className="ml-auto" navbar>

                <UncontrolledDropdown nav>
                  <DropdownToggle
                    caret
                    color="default"
                    data-toggle="dropdown"
                    nav
                    onClick={e => e.preventDefault()}
                  >
                    <div className="photo">
                      <img alt="..." src={require('../../assets/img/icon.png')} />
                    </div>
                    <b className="caret d-none d-lg-block d-xl-block" />
                    <p className="d-lg-none">Logout</p>
                  </DropdownToggle>
                  <DropdownMenu className="dropdown-navbar" right tag="ul">
                    {/* <DropdownItem divider tag="li" /> */}
                    <NavLink tag="li" onClick={this.logout}>
                      <DropdownItem className="nav-item">Logout</DropdownItem>
                    </NavLink>
                    {/* <DropdownItem divider tag="li" /> */}
                  </DropdownMenu>
                </UncontrolledDropdown>
                <li className="separator d-lg-none" />
              </Nav>
            </Collapse>
          </Container>
        </Navbar>
        <Modal
          modalClassName="modal-search"
          isOpen={this.state.modalSearch}
          toggle={this.toggleModalSearch}
        >
          <div className="modal-header">
            <Input id="inlineFormInputGroup" placeholder="SEARCH" type="text" />
            <button
              aria-label="Close"
              className="close"
              data-dismiss="modal"
              type="button"
              onClick={this.toggleModalSearch}
            >
              <i className="tim-icons icon-simple-remove" />
            </button>
          </div>
        </Modal>
      </div>
    );
  }
}

const mapDispatchToProps = { logout };

const mapStateToProps = ({ Auth }) => {
  let { role, balance, address } = Auth;
  return { role, balance, address };
};

export default connect(mapStateToProps, mapDispatchToProps)(AdminNavbar);