import getProcessor from "../../components/highlight";

export default function DocPage({ html }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} ></div>;
}

const docs = {
  expressions: require("./expressions.md"),
  objects: require("./objects.md")
}

export async function getStaticProps({ params }) {
  const doc = docs[params.id];

  if (!doc) {
    throw "Not Found"
  }
  
  let processor = await getProcessor()
  const content = await processor.process(doc) //await markdownToHtml(doc);

  return {
    props: {
      html: content.value,
    },
  };
}

export async function getStaticPaths() {
  return {
    paths: [{ 
      params: { id: 'expressions' } 
    }, { 
      params: { id: 'objects' } 
    }],
    fallback: false, // can also be true or 'blocking'
  };
}
