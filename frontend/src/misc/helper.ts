const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }

const shuffle = (array: Array<unknown>) => {
  let currentIndex = array.length;

  while (currentIndex != 0) {

    const randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
}

const compare = (a: string, b: string, tolerance: number): boolean => {
  const aStripped = a.toLowerCase().replace(/[^a-zA-Z]/g, "");
  const bStripped = b.toLowerCase().replace(/[^a-zA-Z]/g, "");

  const len = aStripped.length <= bStripped.length ? aStripped.length : bStripped.length
  let same = 0;
  let i = 0;
  
  for (i=0;i<len;i++) {
    if (aStripped[i] === bStripped[i]) {
      same++;
    }
  }

  if ((same / aStripped.length) + tolerance >= 1) {
    return true;
  }

  return false;
}

export default {getCookie, shuffle, compare}