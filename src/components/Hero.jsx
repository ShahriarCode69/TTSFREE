import MainTTS from "./MainTTS"

const Hero = () => {
  return (
    <>
      <section className="text-center">
        <div className="min-h-screen w-full relative">
          <div
            className="fixed inset-0 z-[-999]"
            style={{
              background: `
         radial-gradient(ellipse 80% 60% at 5% 40%, rgba(175, 109, 255, 0.48), transparent 67%),
        radial-gradient(ellipse 70% 60% at 45% 45%, rgba(255, 100, 180, 0.41), transparent 67%),
        radial-gradient(ellipse 62% 52% at 83% 76%, rgba(255, 235, 170, 0.44), transparent 63%),
        radial-gradient(ellipse 60% 48% at 75% 20%, rgba(120, 190, 255, 0.36), transparent 66%),
        linear-gradient(45deg, #f7eaff 0%, #fde2ea 100%)`,
            }} />
          <div className="container mx-auto px-6">
            <h1 className="text-5xl md:text-6xl font-bold text-black mt-12 mb-3 leading-tight">Lifetime Free Text-to-Speech</h1>
            <p className="max-w-[60ch] mx-auto">Lorem ipsum dolor sit amet consectetur adipisicing elit. Nostrum veniam ipsa, adipisci earum reiciendis unde incidunt excepturi quis recusandae, deserunt corrupti itaque eligendi.</p>
          </div>
          <MainTTS />
        </div>
      </section>
    </>

  )
}

export default Hero