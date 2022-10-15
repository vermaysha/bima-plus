import http from './http'
import axios from 'axios'
import chalk from 'chalk'
import { Table } from 'console-table-printer'
import * as Progress from 'cli-progress'

interface Packages {
  id?: number
  productId: number
  productName: string
  productPrice: number
}

interface ProviderInfo {
  profileTime?: number
  secretKey?: string
  subscriberType?: string
  language?: string
  accessToken?: string | null
  appsflyerMsisdn?: string
  callPlan?: string
  balance?: string
  creditLimit?: string
  msisdn?: string
}

class Bima {
  private _packages: Array<Packages>
  private _info: ProviderInfo | null

  public constructor() {
    this._packages = []
    this._info = null
  }

  /**
   * send OTP
   * @param no number
   * @returns Promise
   */
  public sendOtp(no: string) {
    return new Promise((resolve, reject) => {
      axios
        .post('https://bimaplus.tri.co.id/api/v1/login/otp-request', {
          imei: 'WebSelfcare',
          msisdn: no
        })
        .then(res => {
          if (res.data.status) {
            resolve(`Kode OTP Telah dikirimkan ke nomor ${chalk.yellow(no)}\n`)
          } else {
            reject(`Kode OTP Gagal dikirimkan ke nomor ${chalk.yellow(no)}\n`)
          }
        })
        .catch(err => {
          reject(err)
        })
    })
  }

  /**
   * Login
   *
   * @param no string
   * @param otp string
   * @returns Promise
   */
  public login(no: string, otp: string) {
    return new Promise((resolve, reject) => {
      axios
        .post('https://bimaplus.tri.co.id/api/v1/login/login-with-otp', {
          imei: 'WebSelfcare',
          msisdn: no,
          otp
        })
        .then(res => {
          if (res.data.status) {
            this._info = res.data
            resolve(this._info)
          } else {
            reject('Kode Otentikasi yang kamu masukkan salah.')
          }
        })
        .catch(err => {
          reject(err)
        })
    })
  }

  public purchase(id: string) {
    return new Promise((resolve, reject) => {
      const pkg = this.getPackage(Number.parseInt(id))
      axios
        .post('https://bimaplus.tri.co.id/api/v1/purchase/purchase-product', {
          productId: pkg.productId,
          paymentMethod: '00',
          servicePlan: 'Tri Mania',
          vendorId: 11,
          menuCategory: null,
          menuIdSource: null,
          menuSubCategory: null,
          menuCategoryName: 'rfu',
          menuSubCategoryName: 'rfu',
          productAddOnId: null,
          addonMenuCategory: null,
          addonMenuSubCategory: null,
          utm: '',
          utmSource: '',
          utmMedium: '',
          utmCampaign: '',
          utmContent: '',
          utmTerm: '',
          msisdn: this._info?.msisdn,
          secretKey: this._info?.secretKey,
          subscriberType: this._info?.subscriberType,
          callPlan: this._info?.callPlan,
          language: '0',
          imei: 'WebSelfcare'
        })
        .then(res => {
          if (res.data.status) {
            resolve(
              `Pendaftaran Paket Data ${chalk.white(
                pkg.productName
              )} pada nomor ${chalk.yellow(this._info?.msisdn)} Berhasil !\n`
            )
          } else {
            reject(
              `Pendaftaran Paket Data ${chalk.white(
                pkg.productName
              )} pada nomor ${chalk.yellow(this._info?.msisdn)} Gagal !\n`
            )
          }
        })
        .catch(err => {
          reject(err)
        })
    })
  }

  /**
   * Update package
   */
  public async updatePackages(): Promise<void> {
    const progress = new Progress.SingleBar({
      format: `Retriveing package detail | ${chalk.cyan(
        '{bar}'
      )}| {percentage}% || {value}/{total} Chunks`,
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true
    })

    const packages = this.getPackageIds()

    progress.start(packages.length, 0)

    for (let i = 0; i < packages.length; i++) {
      const id = packages[i]

      progress.increment()
      const pkg = await this.updatePackage(id)

      if (pkg == null) {
        continue
      }

      this._packages.push({
        id: i + 1,
        productId: pkg.productId,
        productName: pkg.productName,
        productPrice: pkg.productPrice
      })
    }

    progress.stop()
  }

  /**
   * getPackageIds
   */
  public getPackageIds(): Array<number> {
    return [
      25_604, 25_693, 25_476, 25_341, 25_340, 25_603, 25_602, 25_604, 25_693,
      25_476, 25_247, 25_690, 25_469, 25_459, 22_648, 25_267, 23_160, 25_676,
      25_683, 24_163, 25_461, 25_460, 25_465, 25_636, 25_635, 25_255, 25_254,
      25_549, 25_546, 25_545, 25_632, 25_637, 25_692, 25_675, 25_673, 23_982,
      25_701, 25_719, 25_737, 25_669
    ]
  }

  /**
   * updatePackage
   */
  public async updatePackage(productId: number): Promise<Packages | null> {
    return new Promise(resolve => {
      http
        .post(
          'https://my.tri.co.id/apibima/product/product-detail',
          {
            imei: 'WebSelfcare',
            language: '0',
            subscriberType: 'Prepaid',
            productId
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Charset: 'UTF-8',
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36 Edg/106.0.1370.34'
            }
          }
        )
        .then(
          res => {
            if (res.data.product == null) {
              resolve(null)
            } else {
              resolve({
                productId: Number.parseInt(res.data.product.productId),
                productName: String(res.data.product.productName).toString(),
                productPrice: Number.parseInt(res.data.product.productPrice)
              })
            }
          },
          () => {
            resolve(null)
          }
        )
    })
  }

  /**
   * printPackagesTable
   */
  public printPackagesTable() {
    // const packages = this.db.prepare('SELECT * FROM products ORDER BY id').all()
    const packages = this._packages

    const table = new Table({
      title: 'Daftar Paket Data',
      columns: [
        { name: 'No', alignment: 'center', color: 'yellow' },
        { name: 'Nama', alignment: 'left', color: 'white' },
        { name: 'Harga', alignment: 'left', color: 'yellow' }
      ]
    })

    for (const row of packages) {
      table.addRow({
        No: row.id,
        Nama: row.productName,
        Harga: this.format(row.productPrice)
      })
    }

    table.printTable()
  }

  /**
   * getPackage
   */
  public getPackage(id: number): Packages {
    const index = this._packages.findIndex(s => s.id === id)

    return this._packages[index]
  }

  /**
   * format
   */
  public format(price: number): String {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price)
  }
}

export default new Bima()
