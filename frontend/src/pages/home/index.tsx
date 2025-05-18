import { Link, Outlet } from "react-router-dom";
import PageContents from "../../components/PageContents";
import styles from "./Home.module.css";

const Home = () => {
  return (
    <>
      <PageContents>
        <div className={styles.container}>
          <div>
            <Link to="/createlobby">Create Lobby</Link>
          </div>
          <div>
            <Link to="/joinlobby">Join Lobby</Link>
          </div>
          <Outlet />
        </div>
      </PageContents>
    </>
  );
};

export default Home;
