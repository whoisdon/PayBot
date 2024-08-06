![](https://i.imgur.com/5IiGqEh.png)

<h1 align="center"> 
	PayBot
</h1>

> A seguinte aplicação foi desenvolvida com o objetivo de automatizar vendas utilizando o sistema de pagamento via Pix, integrada ao Discord. Trata-se de um bot que facilita a transação entre vendedores e compradores, proporcionando um processo rápido, seguro e eficiente. Com essa ferramenta, os usuários podem realizar compras diretamente no Discord.

Antes de começar, informamos que este bot **NÃO** envia atualizações de status de pagamento, pois não possui integração com nenhuma API de vendas, como o MercadoPago, por exemplo. O bot apenas gera o QR Code com o valor fornecido e as informações especificadas nas configurações do projeto.

Não utilize esta aplicação para realizar fraudes ou desviar seu propósito original. Não nos responsabilizamos por qualquer uso indevido do nosso repositório para aplicar golpes. Aconselha-se discernimento.

#### [Leia a documentação →](https://discord.js.org/#/)

## Configurações
Para configurar sua aplicação, siga estas etapas: Localize o arquivo `.env.example` no repositório do seu projeto. Renomeie o arquivo de `.env.example` para `.env`. No arquivo `.env`, você encontrará uma linha semelhante a esta:

```plaintext
TOKEN=
CHAVE_PIX=
NOME=
BANCO=
```
Após o sinal de igual (=), cole o token do seu bot do Discord, logo em seguida sua chave PIX, seu nome e o nome do seu banco. Deve ficar assim:
```plaintext
TOKEN="token_do_bot_aqui"
CHAVE_PIX="sua_chave_pix_aqui"
NOME="seu_nome_aqui"
BANCO="nome_do_seu_banco"
```
Salve o arquivo `.env`.

Agora, sua aplicação está configurada para usar o token do bot do discord que você forneceu no arquivo `.env`. Lembre-se de manter este arquivo seguro e nunca compartilhar seu token com mais ninguém.

## Configurando o Banco de Dados

Aqui estamos assumindo que você já sabe como configurar seu aplicativo Firebase. Portanto, vamos apenas mostrar onde adicionar as configurações de conexão do seu projeto Firebase. No arquivo `src > Database > Cloud > Firebase.cjs`, adicione as configurações apresentadas em seu projeto Firebase para a conexão.

## Instalando Dependências

Para começar com este projeto, você precisará instalar suas dependências. Você pode escolher seu gerenciador de pacotes preferido nas opções abaixo.

```bash
# com npm (recomendado)
npm install

# com pnpm
pnpm install

# com yarn
yarn install

# com bun
bun install
```
Sinta-se à vontade para personalizar as instalações de acordo com suas preferências.

## Iniciar o Projeto

Você pode iniciar o projeto facilmente usando diretamente o comando
```bash
node .
```
Eu pessoalmente recomendo experimentar o [bun](https://github.com/oven-sh/bun) para iniciar seu projeto - é uma tecnologia nova e brilhante.
```bash
# com npm
npm install -g bun
```
Para iniciar o projeto:
```plaintext
bun run index.js
```

## License

Este projeto é licenciado sob a Licença Apache. Por favor, consulte o [LICENSE](LICENSE) para mais detalhes.
