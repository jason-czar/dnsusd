import thumbImage from "@/assets/thumb-screenshot.png";

const Thumb = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        <img 
          src={thumbImage} 
          alt="Crypto Alias Resolver Interface" 
          className="w-full h-auto rounded-lg shadow-lg"
        />
      </div>
    </div>
  );
};

export default Thumb;
