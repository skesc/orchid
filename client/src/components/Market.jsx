function Market({handleAddHat}) {
  const HATS = ["/hat-1.png", "/hat-2.png", "/hat-3.png"];
  return (
    <div className="fixed right-0 h-screen w-[30rem] top-0 transform  z-10   p-5 space-x-2">
      <div className="h-full w-full p-4 box-shadow-3d flex flex-wrap gap-4 bg-neutral-200 rounded-md">
      {HATS.map((hat, i) => (
        <img key={i} src={hat} alt={`Hat ${i + 1}`} className="h-20 z-10 cursor-pointer hover:opacity-70" onClick={() => handleAddHat(hat)} />
      ))}
      </div>
    </div>
  );
}

export default Market
