const NotFound = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center manga-panel p-8">
        <h1 className="mb-4 text-6xl font-serif">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">页面未找到</p>
        <a href="/" className="text-accent underline hover:opacity-80">
          返回首页
        </a>
      </div>
    </div>
  );
};

export default NotFound;
