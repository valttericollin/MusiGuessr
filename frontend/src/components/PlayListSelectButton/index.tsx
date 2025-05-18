const PlayListSelectButton = ({ playlist, handlePlaylistSelect }) => {
  const onSelect = () => {
    handlePlaylistSelect(playlist);
  };

  return (
    <div>
      <button onClick={onSelect}>{playlist.name}</button>
    </div>
  );
};

export default PlayListSelectButton;
