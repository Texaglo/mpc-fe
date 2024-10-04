import React from "react";
import { connect } from "react-redux";
import PerfectScrollbar from "perfect-scrollbar";
import { HashRouter as Router, Route, Switch } from "react-router-dom";

// core components
import routes from "../routes.js";
import Loader from "../components/Loader";
import Footer from "../components/Footer/Footer.jsx";
import Sidebar from "../components/Sidebar/Sidebar.jsx";
import AdminNavbar from "../components/Navbars/AdminNavbar.jsx";


var ps;
class Admin extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      backgroundColor: "blue",
      // activeTab: localStorage.getItem('active'),
      // sidebarOpened: document.documentElement.className.indexOf("nav-open") !== -1
    };
  }
  componentDidMount() {
    if (navigator.platform.indexOf("Win") > -1) {
      document.documentElement.className += " perfect-scrollbar-on";
      document.documentElement.classList.remove("perfect-scrollbar-off");
      ps = new PerfectScrollbar(this.refs.mainPanel, { suppressScrollX: true });
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
      this.refs.mainPanel.scrollTop = 0;
    }
  }
  // this function opens and closes the sidebar on small devices
  toggleSidebar = () => {
    document.documentElement.classList.toggle("nav-open");
    this.setState({ sidebarOpened: !this.state.sidebarOpened });
  };

  getRoutes = routes => {
    return routes.map((prop, key) => {
      if (prop.layout === "/home") {
        return (
          <Router>
            <Switch>
              <Route
                exact={true}
                path={prop['layout'] + prop['path']}
                component={prop['component']}
                key={key}
              />
            </Switch>
          </Router>
        );
      } else return null;
    });
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
    return (
      <div className="wrapper">
        {isLoader && <Loader />}
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
          ref="mainPanel"
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
  let { auth, isLoader } = Auth
  return { auth, isLoader }
}

export default connect(mapStateToProps)(Admin);
