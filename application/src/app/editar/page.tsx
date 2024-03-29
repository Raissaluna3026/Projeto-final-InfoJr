"use client";
/* eslint-disable react/jsx-no-duplicate-props */
/* eslint-disable @next/next/no-img-element */
import { useState, useEffect } from "react";
import Footer from "../components/footer";
import Header from "../components/header";
import styles from './page.module.css';
import EditProd from "../components/editProd";
import { Product, TAG } from "@prisma/client";
import CreateProd from "../components/createProd";

export default function Edicao(){
    const [openCreateProductModal, setOpenCreateProductModal] = useState(false)
    const [visivel, setVisivel] = useState(false);
    const [products, setProducts] = useState<Product[]>([]); // lista de produtos que estarão visíveis na tela
    const [allProducts, setAllProducts] = useState<Product[]>([]); 
    const [search, setSearch] = useState("");
    const [notFound, setNotFound] = useState(false);
    const [collectionFilters, setCollectionFilters] = useState<string[]>([]);
    const [categoriesFilters, setCategoriesFilters] = useState<string[]>([]);
    const [numberFound, setNumberFound] = useState<number>();

    const handleClick = () => {
        setVisivel(!visivel);
    }

    // decodifica o campo size 
    function decodeStringToObj(inputString: string): { [key: string]: number } {
        const obj: { [key: string]: number } = {};
      
        // Divide a string em pares chave-valor separados por vírgula
        const pairs = inputString.split(',');
      
        // Itera sobre cada par chave-valor e adiciona ao objeto
        pairs.forEach((pair) => {
          const [key, value] = pair.split(':');
          const trimmedKey = key.trim();
          const parsedValue = parseInt(value.trim(), 10);
      
          // Verifica se o valor é um número válido antes de adicionar ao objeto
          if (!isNaN(parsedValue)) {
            obj[trimmedKey] = parsedValue;
          }
        });
      
        return obj;
    }


    // pega todos os produtos do banco de dados
    const fetchProducts = async () => {
        try {
            const res = await fetch("../api/v1/product/all");

            if (!res.ok) {
                setNumberFound(0);
                throw new Error('Erro ao buscar produtos');
            }
            
            const data: Product[] = await res.json();
            
            setProducts(data);
            setAllProducts(data);
            setNumberFound(data.length);
          } catch (error) {
            console.log('fetch error: ', error);
        }
    }

    // retorna quantidade de estoque de um produto (somando quantidades de tamanhos diferentes)
    const getAvailableUnits = (product: Product) => {
        const sizeQuantity = decodeStringToObj(product.size);
        let sum = 0;

        for (const key in sizeQuantity){
            sum += sizeQuantity[key];
        }

        return sum;
    }

    // altera ambiente do site de acordo com o que é digitado na barra de pesquisa
    const onSearchHandler = async (name: string | undefined) => {
        if (!name) {
        setNotFound(false);
        return fetchProducts();
        }

        setNotFound(false);

        // verifica se o que está digitado é igual o nome de algum produto
        const result = products.filter((product) => {
        return product.name.toLowerCase().includes(name.toLowerCase());
        });

        if (result.length === 0) {
        setNotFound(true);
        setNumberFound(0);
        } else {
        setProducts(result);
        setNumberFound(result.length);
        }
    };

    const onButtonClickHandler = () => {
        if(search){
          onSearchHandler(search);  
        }
    }

    // detecta digitação na barra de pesquisa
    const onChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);

        // se a barra estiver vazia
        if(e.target.value.length === 0) {
            onSearchHandler(undefined);
        }

        // devolve as palavras q tão sendo digitadas
        onSearchHandler(e.target.value);
    }

    // salva os filtros selecionados pelo clique
    const handleCategoriesChange = (value: string) => {
        // Verifique se o valor já está na lista. Se sim, desmarca a checkbox.
        if (categoriesFilters.includes(value)) {
          setCategoriesFilters((prev) => prev.filter((item) => item !== value));
        } else {
          setCategoriesFilters((prev) => [...prev, value]);
        }
    };

    const handleCollectionChange = (value: string) => {
        // Verifique se o valor já está na lista. Se sim, desmarca a checkbox.
        if (collectionFilters.includes(value)) {
          setCollectionFilters((prev) => prev.filter((item) => item !== value));
        } else {
          setCollectionFilters((prev) => [...prev, value]);
        }
    };


    // função para converter a string da categoria para a string do enum TAG
    const mapStringTOTag = (str: string) =>{
        const lowerCaseStr = str.toLowerCase(); // Converte para minúsculas para garantir correspondência
        switch (lowerCaseStr) {
            case "camisetas":
            return TAG.CAMISA;
            case "acessórios":
            return TAG.ACESSORIOS;
            case "calças":
            return TAG.CALCA;
            case "casacos":
            return TAG.CASACOS;
            case "feminino":
            return TAG.FEMININO;
            case "masculino":
            return TAG.MASCULINO;
            default:
            return null; // Retornar null para valores não correspondentes
        }
    }

    // altera produtos mostrados com base em filtros
    const handleFilterChange = async () => {
        if(categoriesFilters.length != 0 || collectionFilters.length != 0){
            // mudar valores do array para compativeis com tags
            const tagsConverted = categoriesFilters.map(mapStringTOTag);
            

            // codifica possíveis strings com caracteres especiais
            const collectionsConverted = collectionFilters.map((collection) => {return encodeURIComponent(collection)});

            // converte para forma compativel para requisição
            const urlTags = tagsConverted.join(',');
            const urlCollections = collectionsConverted.join(',');

            const res = await fetch(`../api/v1/product/filter?tags=${urlTags}&collections=${urlCollections}`);

            
            if (!res.ok) {
                setNumberFound(0);
                throw new Error('Erro ao filtrar produtos');
            }
            
            const filteredProducts: Product[] = await res.json();
            console.log(filteredProducts);

            setProducts(filteredProducts);
            setNumberFound(filteredProducts.length);
        }
        if(categoriesFilters.length == 0 && collectionFilters.length == 0){
            fetchProducts();
        }
    }

    const resetFilters = () =>{
        setCategoriesFilters([]);
        setCollectionFilters([]);
    }

    // -----------------------------
    // Atualizações Dinâmicas
    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [openCreateProductModal]);

    useEffect(() => {
        handleFilterChange();
    }, [collectionFilters, categoriesFilters]);
    
    return(
        <>
        <Header />
        {openCreateProductModal && <CreateProd closeModal={setOpenCreateProductModal} />}
        <section className={styles.homepage}>            
                <div className={styles.div1}>
                <h2 className={styles.spana}> Edição </h2>
                <div className={styles.filtragem}>
                    <div className={styles.pesquisaprod}>
                        <div className={styles.inptbtn}>
                            <div className={styles.inptprod}>
                                <input type="text"  placeholder="Pesquisar" onChange={onChangeHandler}/>
                                <img src="\icons\search.svg" alt="" onClick={onButtonClickHandler} />
                            </div>
                            <div className={styles.criarprod} onClick={() => setOpenCreateProductModal(true)} style={{cursor:'pointer'}}>
                                Criar produto
                                <img src="\images\imgadd.svg" alt="" />
                            </div>
                        </div>
                        <p>{numberFound} Itens encontrados!</p>
                    </div>
                    <div className={styles.filtros}>
                        <div className={styles.filtro} onClick={() => handleClick()} style={{cursor:'pointer'}}>
                            Filtros
                            <img src="\icons\filter_list.svg" alt="" />
                        </div>
                        {visivel && (
                            <div className={styles.invprod}>
                                <div className={styles.invprodcat}><strong>Categorias</strong> 
                                    <div>
                                        <input type="checkbox" value={"Camisetas"}  checked={categoriesFilters.includes("Camisetas")} onChange={() => handleCategoriesChange("Camisetas")} /> 
                                        Camisetas
                                    </div>
                                    <div>
                                        <input type="checkbox" value={"Acessórios"} checked={categoriesFilters.includes("Acessórios")} onChange={() => handleCategoriesChange("Acessórios")} />
                                        Acessórios
                                    </div>
                                    <div>
                                        <input type="checkbox" value={"Calças"} checked={categoriesFilters.includes("Calças")} onChange={() => handleCategoriesChange("Calças")} />
                                        Calças
                                    </div>
                                    <div>
                                        <input type="checkbox" value={"Casacos"} checked={categoriesFilters.includes("Casacos")} onChange={() => handleCategoriesChange("Casacos")} />
                                        Casacos
                                    </div>
                                    <div>
                                        <input type="checkbox" value={"Feminino"} checked={categoriesFilters.includes("Feminino")} onChange={() => handleCategoriesChange("Feminino")} />
                                        Feminino
                                    </div>
                                    <div>
                                        <input type="checkbox" value={"Masculino"} checked={categoriesFilters.includes("Masculino")} onChange={() => handleCategoriesChange("Masculino")} />
                                        Masculino
                                    </div>
                                </div>
                                <div className={styles.invprodcole}>
                                    <strong>Coleções</strong>
                                    <div>
                                        <input type="checkbox" value={"Keith Haring & Bvlck"} checked={collectionFilters.includes("Keith Haring & Bvlck")} onChange={() => handleCollectionChange("Keith Haring & Bvlck")} />
                                        Keith Haring & Bvlck
                                    </div>
                                    <div>
                                        <input type="checkbox" value={"Fortnite & Blvck"} checked={collectionFilters.includes("Fortnite & Blvck")} onChange={() => handleCollectionChange("Fortnite & Blvck")} />
                                        Fortnite & Blvck
                                    </div>
                                    <div>
                                        <input type="checkbox" value={"Mohair"} checked={collectionFilters.includes("Mohair")} onChange={() => handleCollectionChange("Mohair")} />
                                        Mohair
                                    </div>
                                    <div>
                                        <input type="checkbox" value={"Camisetas"} checked={collectionFilters.includes("Camisetas")} onChange={() => handleCollectionChange("Camisetas")} />
                                        Camisetas
                                    </div>
                                    <div>
                                        <input type="checkbox" value={"Whte"} checked={collectionFilters.includes("Whte")} onChange={() => handleCollectionChange("Whte")} />
                                        Whte
                                    </div>
                                </div>
                                <button onClick={() => resetFilters()}>Limpar filtros</button>
                            </div>
                        )}

                        {/* TAGS */}
                        <div className={styles.tagsprod}>
                            {/* CATEGORIAS */}
                          {categoriesFilters.map((filter, index) => {
                                return (
                                    <div className={styles.tagprod} key={index}>
                                        {filter}
                                        <button onClick={() => handleCategoriesChange(filter)}> x </button>
                                    </div>
                                );
                            })}  

                            {/* COLEÇÕES */}
                          {collectionFilters.map((collection, index) => {
                                return (
                                    <div className={styles.tagprod} key={index}>
                                        {collection}
                                        <button onClick={() => handleCollectionChange(collection)}> x </button>
                                    </div>
                                );
                            })} 
                        </div>

                    </div>
                </div>


                {notFound ? (
                            <div className={styles.semitens}>
                                <img src="\images\search_off.svg" alt="" />
                                <h2>Nenhum item encontrado</h2>
                                <p>Tente novamente para encontrar o que você precisa</p>
                            </div>
                            
                        ) : (
                            // itens encontrados ou todos os produtos
                            <div className={styles.gridprodutos2}>
                                {products.map((product, index) => {
                                    return(
                                        <div className={styles.produto} key={index}>
                                            <img src={product.images[0]} alt="BD"  />
                                            <div className={styles.txtproduto}>
                                                <h3>{product.name}</h3>
                                                <p>R$ {product.discountPrice.toFixed(2).replace('.', ',')}<span> <del>R$ {product.totalPrice.toFixed(2).replace('.', ',')}</del></span></p>
                                                <p><span>{getAvailableUnits(product)} Itens em estoque</span></p>
                                            </div>
                                        </div>
                                    )
                                })}
                                 <div className={styles.produto}>
                                    <img src="\images\imgfem2.png" alt="BD"  />
                                    <div className={styles.txtproduto}>
                                        <h3>Blvck Mohair Branded Sweater</h3>
                                        <p>R$ 654,00<span> <del>R$ 746,00</del></span></p>
                                        <p><span>X Itens em estoque</span></p>
                                    </div>
                                </div>
                                <div className={styles.produto}>
                                    <img src="\images\imgfem2.png" alt="BD"  />
                                    <div className={styles.txtproduto}>
                                        <h3>Blvck Mohair Branded Sweater</h3>
                                        <p>R$ 654,00<span> <del>R$ 746,00</del></span></p>
                                        <p><span>X Itens em estoque</span></p>
                                    </div>
                                </div>
                                <div className={styles.produto}>
                                    <img src="\images\imgfem2.png" alt="BD"  />
                                    <div className={styles.txtproduto}>
                                        <h3>Blvck Mohair Branded Sweater</h3>
                                        <p>R$ 654,00<span> <del>R$ 746,00</del></span></p>
                                        <p><span>X Itens em estoque</span></p>
                                    </div>
                                </div>
                                <div className={styles.produto}>
                                    <img src="\images\imgfem2.png" alt="BD"  />
                                    <div className={styles.txtproduto}>
                                        <h3>Blvck Mohair Branded Sweater</h3>
                                        <p>R$ 654,00<span> <del>R$ 746,00</del></span></p>
                                        <p><span>X Itens em estoque</span></p>
                                    </div>
                                </div>
                                <div className={styles.produto}>
                                    <img src="\images\imgfem2.png" alt="BD"  />
                                    <div className={styles.txtproduto}>
                                        <h3>Blvck Mohair Branded Sweater</h3>
                                        <p>R$ 654,00<span> <del>R$ 746,00</del></span></p>
                                        <p><span>X Itens em estoque</span></p>
                                    </div>
                                </div>
                                <div className={styles.produto}>
                                    <img src="\images\imgfem2.png" alt="BD"  />
                                    <div className={styles.txtproduto}>
                                        <h3>Blvck Mohair Branded Sweater</h3>
                                        <p>R$ 654,00<span> <del>R$ 746,00</del></span></p>
                                        <p><span>X Itens em estoque</span></p>
                                    </div>
                                </div>
                                <div className={styles.produto}>
                                    <img src="\images\imgfem2.png" alt="BD"  />
                                    <div className={styles.txtproduto}>
                                        <h3>Blvck Mohair Branded Sweater</h3>
                                        <p>R$ 654,00<span> <del>R$ 746,00</del></span></p>
                                        <p><span>X Itens em estoque</span></p>
                                    </div>
                                </div>
                                <div className={styles.produto}>
                                    <img src="\images\imgfem2.png" alt="BD"  />
                                    <div className={styles.txtproduto}>
                                        <h3>Blvck Mohair Branded Sweater</h3>
                                        <p>R$ 654,00<span> <del>R$ 746,00</del></span></p>
                                        <p><span>X Itens em estoque</span></p>
                                    </div>
                                </div>
                                <div className={styles.produto}>
                                    <img src="\images\imgfem2.png" alt="BD"  />
                                    <div className={styles.txtproduto}>
                                        <h3>Blvck Mohair Branded Sweater</h3>
                                        <p>R$ 654,00<span> <del>R$ 746,00</del></span></p>
                                        <p><span>X Itens em estoque</span></p>
                                    </div>
                                </div>
                                <div className={styles.produto}>
                                    <img src="\images\imgfem2.png" alt="BD"  />
                                    <div className={styles.txtproduto}>
                                        <h3>Blvck Mohair Branded Sweater</h3>
                                        <p>R$ 654,00<span> <del>R$ 746,00</del></span></p>
                                        <p><span>X Itens em estoque</span></p>
                                    </div>
                                </div>
                                <div className={styles.produto}>
                                    <img src="\images\imgfem2.png" alt="BD"  />
                                    <div className={styles.txtproduto}>
                                        <h3>Blvck Mohair Branded Sweater</h3>
                                        <p>R$ 654,00<span> <del>R$ 746,00</del></span></p>
                                        <p><span>X Itens em estoque</span></p>
                                    </div>
                                </div>
                                <div className={styles.produto}>
                                    <img src="\images\imgfem2.png" alt="BD"  />
                                    <div className={styles.txtproduto}>
                                        <h3>Blvck Mohair Branded Sweater</h3>
                                        <p>R$ 654,00<span> <del>R$ 746,00</del></span></p>
                                        <p><span>X Itens em estoque</span></p>
                                    </div>
                                </div> 
                                <div className={styles.numeracaoPagProd}>
                                {'<'}<div className={styles.num}>1</div>{'>'}
                                </div>
                            </div>
                        )}
                </div>
            </section>
        <Footer/>
        </>
    )
}