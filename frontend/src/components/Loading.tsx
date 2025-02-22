export function Loading() {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-300 border-t-gray-700 mx-auto mb-4"></div>
        <p className="text-2xl font-normal text-gray-700">文字起こし中...</p>
      </div>
    </div>
  );
}