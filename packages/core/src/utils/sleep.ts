export default async (ms: number) =>
  new Promise((resolve, reject) => {
    setTimeout(() => resolve(true), ms);
  });
