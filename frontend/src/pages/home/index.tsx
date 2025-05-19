import { Link, Outlet } from "react-router-dom";
import PageContents from "../../components/PageContents";
import styles from "./Home.module.css";
import SpotifyLogo from '../../assets/SpotifyLogo.svg';

const Home = () => {
  const baseAddress = import.meta.env.VITE_BASE_ADDRESS;

  return (
    <>
      <PageContents>
        <div className={styles.container}>
          <div className={styles.buttonContainer}>
            <Link className={styles.button} to={`${baseAddress}/login`}>
              <img src={SpotifyLogo} alt="Spotify" className={styles.logo} />
              Sign in with Spotify to host a game
            </Link>
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
