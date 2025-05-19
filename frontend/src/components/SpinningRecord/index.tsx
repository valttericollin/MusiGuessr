import styles from "./SpinningRecord.module.css";
import VinylRecord from '../../assets/VinylRecord.svg';


const SpinningRecord = ({isSpinning}) => {
  /* const [isSpinning, setIsSpinning] = useState(false); */

  return (
    <div className={styles.imageContainer}>
        <img
        src={VinylRecord}
        className={`${styles.imageBase} ${isSpinning ? styles.spinning : ""}`}
        />
    </div>
  );
};

export default SpinningRecord;
