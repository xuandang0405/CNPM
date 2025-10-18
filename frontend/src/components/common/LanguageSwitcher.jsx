import React from 'react'
import useUserStore from '../../store/useUserStore'
import { availableLangs } from '../../i18n'

export default function LanguageSwitcher(){
  const { lang, setLang } = useUserStore()
  return (
    <select className="form-input w-36" value={lang} onChange={e=>setLang(e.target.value)}>
      {availableLangs().map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
    </select>
  )
}
