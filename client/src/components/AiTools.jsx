import React from 'react'
import { AiToolsData } from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'

const AiTools = () => {
  const navigate = useNavigate()
 const { isSignedIn } = useUser()


  return (
    <div className='px-4 sm:px-20 xl:px-32 my-24'>
      <div className='text-center'>
        <h2 className='text-slate-700 text-[42px] font-semibold'>
          Powerful AI Tools
        </h2>
        <p className='text-gray-500 max-w-lg mx-auto'>
          EveryThing you need to create,enhance,and optimize your content with cutting-edge AI technology.
        </p>
      </div>

    <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 place-items-center">
  {AiToolsData.map((tool, index) => (
    <div
      key={index}
      className="w-full max-w-sm p-6 rounded-xl bg-white shadow-md border border-gray-100 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
      onClick={() => {
      if (!isSignedIn) return
      navigate(tool.path)
}}

    >
      <div
        className="w-12 h-12 flex items-center justify-center rounded-xl"
        style={{
          background: `linear-gradient(to bottom, ${tool.bg.from}, ${tool.bg.to})`,
        }}
      >
        <tool.Icon className="w-6 h-6 text-white" />
      </div>

      <h3 className="mt-4 mb-2 text-lg font-semibold text-gray-900">
        {tool.title}
      </h3>

      <p className="text-gray-500 text-sm leading-relaxed">
        {tool.description}
      </p>
    </div>
  ))}
</div>

    </div>
  )
}

export default AiTools