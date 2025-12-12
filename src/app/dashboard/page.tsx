export default function Dashboard() {
  return (
    <>
      <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <h2 className="text-slate-500 text-sm">Total Properties</h2>
          <p className="text-2xl font-bold">0</p>
        </div>

        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <h2 className="text-slate-500 text-sm">Employees</h2>
          <p className="text-2xl font-bold">0</p>
        </div>

        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <h2 className="text-slate-500 text-sm">Hours Today</h2>
          <p className="text-2xl font-bold">0</p>
        </div>
      </div>
    </>
  );
}
