export default async function Page({
  params,
  searchParams,
}: PageProps<"/[slug]">) {
  const routeParams = await params;
  const query = await searchParams;

  return (
    <div>
      <h1>Page Component</h1>
      <pre>{JSON.stringify(routeParams, null, 2)}</pre>
      <pre>{JSON.stringify(query, null, 2)}</pre>
    </div>
  );
}
