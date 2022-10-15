import chalk from 'chalk'
import { createInterface } from 'readline'
import bimaPlus from './bimaPlus'
import * as pkg from './package.json'

console.log(chalk.bold(chalk.green('\t\tSELAMAT DATANG\n')))
console.log(chalk.gray(`Name\t:`) + chalk.white(' Bima+ Package Injector'))
console.log(chalk.gray(`Version :`) + chalk.white(` ${pkg.version}\n`))

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
})

rl.on('close', () => {
  console.log(
    `\n${chalk.bold(chalk.cyan('\t\tTerima Kasih'))}\n${chalk.gray(
      'Sudah Menggunakan Aplikasi Bima+ Package Injector'
    )}\n${chalk.gray('Author')}: ${chalk.green(
      'Ashary Vermaysha'
    )}\n${chalk.gray('Whatsapp')}: ${chalk.green('0895346266988')}`
  )
})

login(rl)

async function login(rl: ReturnType<typeof createInterface>) {
  rl.question('\nSilahkan masukkan nomor kartu 3 mu: ', no => {
    if (no.match(/^(0895|0896|0897|0898|0899)([0-9]+)$/)) {
      bimaPlus
        .sendOtp(no)
        .then(msg => {
          console.log(chalk.green(msg))

          rl.question('Silahkan masukan Kode OTP yang telah dikirim: ', otp => {
            bimaPlus
              .login(no, otp)
              .then(() => {
                main(rl)
              })
              .catch(err => {
                console.log(chalk.red(err))
                repeatToLogin(rl)
              })
          })
        })
        .catch(msg => {
          console.log(chalk.red(msg))
          repeatToLogin(rl)
        })
    } else {
      console.log(chalk.red('\nNomor tidak valid !'))
      repeatToLogin(rl)
    }
  })
}

async function main(rl: ReturnType<typeof createInterface>) {
  bimaPlus.updatePackages().then(() => {
    console.log('\n')
    bimaPlus.printPackagesTable()

    rl.question(chalk.gray('\nPilih paket data: '), id => {
      const pkg = bimaPlus.getPackage(Number.parseInt(id))

      console.log(chalk.bold(chalk.green('\n\t\tDetail Paket Data\n')))
      console.log(chalk.gray(`Nama\t: `) + chalk.white(pkg.productName))
      console.log(
        chalk.gray(`Harga\t: `) + chalk.white(bimaPlus.format(pkg.productPrice))
      )

      rl.question(
        '\nApakah kamu yakin ingin membeli paket ini ? [Y/n] ',
        conf => {
          if (String(conf).toUpperCase() === 'Y') {
            bimaPlus
              .purchase(id)
              .then(msg => {
                console.log(chalk.green(msg))
                rl.close()
              })
              .catch(err => {
                console.log(chalk.red(err))
                repeatToMainMenu(rl)
              })
          } else {
            main(rl)
          }
        }
      )
    })
  })
}

function repeatToLogin(rl: ReturnType<typeof createInterface>) {
  rl.question('Ulangi Login ? [Y/n] ', answer => {
    if (String(answer).toUpperCase() === 'Y') {
      login(rl)
      return
    }

    rl.close()
  })
}

function repeatToMainMenu(rl: ReturnType<typeof createInterface>) {
  rl.question('Ulangi ? [Y/n] ', answer => {
    if (String(answer).toUpperCase() === 'Y') {
      main(rl)
      return
    }

    rl.close()
  })
}
