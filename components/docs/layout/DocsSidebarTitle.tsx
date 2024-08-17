export default function DocsSidebarTitle({ children, extra }: { children: any, extra?: any }) {
  return (
    <div>
      <div className="h-10 flex flex-row items-center justify-between">
        <h1 className="text-foreground text-lg">
          {children}
        </h1>
        {extra}
      </div>
      <hr className="mt-2 mb-6 border-neutral-600"/>
    </div>
  )
}