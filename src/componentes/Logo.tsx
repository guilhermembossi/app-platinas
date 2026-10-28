import { marca } from '../config/marca';

export default function Logo({ tamanho }: { tamanho: number }) {
  return (
    <img className="logo" src={`${import.meta.env.BASE_URL}icones/icone.svg`} width={tamanho} height={tamanho} alt={marca.nome} />
  );
}
