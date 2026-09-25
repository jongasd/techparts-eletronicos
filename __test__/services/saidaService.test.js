jest.mock("../../src/models/saida.js")
jest.mock("../../src/models/produtos.js")
jest.mock("../../src/models/lote.js")
jest.mock("../../src/config/database.js")

const Saida = require("../../src/models/saida")
const Produto = reuqire("../../src/models/produtos")
const Lote = require("../../src/models/lote")
const pool = require("../../src/config/database")
const saidaService = require("../../src/services/saidaService")

const criarConnMock = ()=> ({
    beginTransaction: jest.fn().mockResolvedValue(undefined),
    commit: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn()
})

describe("saidaService", ()=>{
    let conn

    beforeEach(()=>{
        conn = criarConnMock()
        pool.getConnection = jest
    })
})