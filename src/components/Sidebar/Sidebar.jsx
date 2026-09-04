import React from "react";
import { connect } from 'react-redux';
import { NavLink } from "react-router-dom";
import { PropTypes } from "prop-types";
import PerfectScrollbar from "perfect-scrollbar";

// reactstrap components
import { Nav } from "reactstrap";
import { canAccess } from '../../utils/adminAccess';

var ps;

class Sidebar extends React.Component {
  constructor(props) {
    super(props);
    this.sidebarRef = React.createRef();
    this.activeRoute.bind(this);
  }
  // verifies if routeName is the one active (in browser input)
  activeRoute(routeName) {
    return this.props.location.pathname.indexOf(routeName) > -1 ? "active" : "";
  }
  componentDidMount() {
    if (navigator.platform.indexOf("Win") > -1) {
      ps = new PerfectScrollbar(this.sidebarRef.current, {
        suppressScrollX: true,
        suppressScrollY: false
      });
    }
  }
  componentWillUnmount() {
    if (navigator.platform.indexOf("Win") > -1) {
      ps.destroy();
    }
  }
  linkOnClick = () => {
    document.documentElement.classList.remove("nav-open");
  };
  render() {
    const { bgColor, routes, rtlActive, role, permissions } = this.props;
    const access = { role, permissions };

    return (
      <div className="sidebar" data={bgColor}>
        <div className="sidebar-wrapper" ref={this.sidebarRef}>
          <div className="logo mpc-sidebar-brand">
            <NavLink to="/home/dashboard" className="mpc-sidebar-brand-link" onClick={this.linkOnClick}>
              <img alt="Modern Poker Club" src={require('../../assets/img/mpc-logo.png')} />
              <span className="mpc-sidebar-console-label">
                <strong>Admin Console</strong>
                <small>Secure operations</small>
              </span>
            </NavLink>
          </div>
          <Nav>
            {routes.filter((route) => canAccess(access, route.permission)).map((prop) => {
              return (
                <React.Fragment key={`${prop.layout}${prop.path}`}>
                  {!prop['hidden'] &&
                    <li
                      className={
                        this.activeRoute(prop.path) +
                        (prop.pro ? "active-pro" : "")
                      }
                    >
                      <NavLink
                        to={prop.layout + prop.path}
                        className="nav-link"
                        activeClassName="active"
                      // onClick={() => this.props.toggleSidebar(prop.name)}
                      >
                        <i className={prop.icon} />
                        {rtlActive ? prop.rtlName : (prop.sidebarName || prop.name)}
                      </NavLink>
                    </li>}
                </React.Fragment>
              );
            })}
          </Nav>
        </div>
      </div>
    );
  }
}

Sidebar.defaultProps = {
  rtlActive: false,
  bgColor: "primary",
  routes: [{}]
};

Sidebar.propTypes = {
  // if true, then instead of the routes[i].name, routes[i].rtlName will be rendered
  // insde the links of this component
  rtlActive: PropTypes.bool,
  bgColor: PropTypes.oneOf(["primary", "blue", "green"]),
  routes: PropTypes.arrayOf(PropTypes.object),
  logo: PropTypes.shape({
    // innerLink is for links that will direct the user within the app
    // it will be rendered as <Link to="...">...</Link> tag
    innerLink: PropTypes.string,
    // outterLink is for links that will direct the user outside the app
    // it will be rendered as simple <a href="...">...</a> tag
    outterLink: PropTypes.string,
    // the text of the logo
    text: PropTypes.node,
    // the image src of the logo
    imgSrc: PropTypes.string
  })
};

// export default Sidebar;


const mapDispatchToProps = {};

const mapStateToProps = ({ Auth }) => {
  let { role, permissions } = Auth;
  return { role, permissions };
};
export default connect(mapStateToProps, mapDispatchToProps)(Sidebar);
