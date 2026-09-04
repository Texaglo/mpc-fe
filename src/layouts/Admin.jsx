import React from "react";
import { connect } from "react-redux";
import PerfectScrollbar from "perfect-scrollbar";
import { HashRouter as Router, Route, Switch, Redirect } from "react-router-dom";

// core components
import routes from "../routes.js";
import Loader from "../components/Loader";
import Footer from "../components/Footer/Footer.jsx";
import Sidebar from "../components/Sidebar/Sidebar.jsx";
import AdminNavbar from "../components/Navbars/AdminNavbar.jsx";
import SectionTabs from "../components/SectionTabs/SectionTabs.jsx";
import axios from 'axios';
import { canAccess } from '../utils/adminAccess';


var ps;
class Admin extends React.Component {
  constructor(props) {
    super(props);
    this.mainPanelRef = React.createRef();
    this.state = {
      backgroundColor: "blue",
      // activeTab: localStorage.getItem('active'),
      // sidebarOpened: document.documentElement.className.indexOf("nav-open") !== -1
    };
  }
  componentDidMount() {
    axios.get('/admin/access/me').then((response) => {
      const access = response?.data?.body || {};
      this.props.setAdminAccess({ role: access.role, permissions: access.permissions || [] });
    }).catch(() => {});
    if (navigator.platform.indexOf("Win") > -1) {
      document.documentElement.className += " perfect-scrollbar-on";
      document.documentElement.classList.remove("perfect-scrollbar-off");
      ps = new PerfectScrollbar(this.mainPanelRef.current, { suppressScrollX: true });
      let tables = document.querySelectorAll(".table-responsive");
      for (let i = 0; i < tables.length; i++) {
        ps = new PerfectScrollbar(tables[i]);
      }
    }
  }
  componentWillUnmount() {
    if (navigator.platform.indexOf("Win") > -1) {
      ps.destroy();
      document.documentElement.className += " perfect-scrollbar-off";
      document.documentElement.classList.remove("perfect-scrollbar-on");
    }
  }
  componentDidUpdate(e) {
    if (e.history.action === "PUSH") {
      if (navigator.platform.indexOf("Win") > -1) {
        let tables = document.querySelectorAll(".table-responsive");
        for (let i = 0; i < tables.length; i++) {
          ps = new PerfectScrollbar(tables[i]);
        }
      }
      document.documentElement.scrollTop = 0;
      document.scrollingElement.scrollTop = 0;
      if (this.mainPanelRef.current) this.mainPanelRef.current.scrollTop = 0;
    }
  }
  // this function opens and closes the sidebar on small devices
  toggleSidebar = () => {
    document.documentElement.classList.toggle("nav-open");
    this.setState({ sidebarOpened: !this.state.sidebarOpened });
  };

  getRoutes = routes => {
    const allowedRoutes = routes.filter((route) => canAccess({ role: this.props.role, permissions: this.props.permissions }, route.permission));
    const firstAllowedRoute = allowedRoutes[0] || routes[0];
    const firstAllowedPath = firstAllowedRoute.layout + firstAllowedRoute.path;
    return (
      <Router>
        <Switch>
          {allowedRoutes.map((prop, key) => {
            if (prop.layout === "/home") {
              const PageComponent = prop.component;
              return (
                <Route
                  exact={true}
                  path={prop['layout'] + prop['path']}
                  render={routeProps => (
                    <>
                      <SectionTabs pathname={routeProps.location.pathname} />
                      <PageComponent {...routeProps} />
                    </>
                  )}
                  key={key}
                />
              );
            } else return null;
          })}
          <Redirect exact from="/home" to={firstAllowedPath} />
          <Redirect to={firstAllowedPath} />
        </Switch>
      </Router>
    );
  };

  selectTab = (activeTab) => this.setState({ activeTab });
  handleBgClick = color => this.setState({ backgroundColor: color });

  getBrandText = path => {
    for (let i = 0; i < routes.length; i++) {
      if (
        this.props.location.pathname.indexOf(
          routes[i].layout + routes[i].path
        ) !== -1
      ) {
        return routes[i].name;
      }
    }
    return "Brand";
  };

  render() {
    let { activeTab } = this.state;
    let { isLoader } = this.props;
    const isLoaderVisible = typeof isLoader === "object"
      ? Boolean(isLoader && isLoader.status)
      : Boolean(isLoader);
    return (
      <div className="wrapper">
        {isLoaderVisible && <Loader />}
        <Sidebar
          {...this.props}
          routes={routes}
          activeTab={activeTab}
          bgColor={this.state.backgroundColor}
          logo={{
            outterLink: "#",
            text: "BitDandy",
          }}
          toggleSidebar={this.toggleSidebar}
        />
        <div
          className="main-panel"
          ref={this.mainPanelRef}
          data={this.state.backgroundColor}
        >
          <AdminNavbar
            {...this.props}
            brandText={this.getBrandText(this.props.location.pathname)}
            toggleSidebar={this.toggleSidebar}
            sidebarOpened={this.state.sidebarOpened}
          />
          {this.getRoutes(routes)}
        </div>
        <Footer />
      </div>
    );
  }
}

const mapStateToProps = ({ Auth }) => {
  let { auth, isLoader, role, permissions } = Auth
  return { auth, isLoader, role, permissions }
}

const mapDispatchToProps = dispatch => ({
  setAdminAccess: access => dispatch({ type: 'SET_ADMIN_ACCESS', payload: access }),
});

export default connect(mapStateToProps, mapDispatchToProps)(Admin);
