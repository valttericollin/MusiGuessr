import { Link, Outlet } from "react-router-dom";
import PageContents from "../../components/PageContents";
import styles from "./Home.module.css";

const Home = () => {

  return (
    <>
      <PageContents>
        <div className={styles.container}>
          <div className={styles.buttonContainer}>
            <Link className={styles.button} to="/createlobby"  /* onClick={handleCreateLobbyClick} */>Create Lobby</Link>
          </div>
          <div className={styles.buttonContainer}>
            <Link className={styles.button} to="/joinlobby">Join Lobby </Link>
          </div>
          <Outlet />
        </div>
      </PageContents>
    </>
  );
};

export default Home;
