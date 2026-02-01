import clientPromise from "./mongodb";

export async function getMarathonsCollection() {
  return (await clientPromise).db("marathons").collection("list");
}
