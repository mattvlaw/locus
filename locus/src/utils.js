export const arrayToDict = (array, keyField) => {
    const resultDict = {};
    for (const item of array) {
      resultDict[item[keyField]] = item;
    }
    return resultDict;
  };
  